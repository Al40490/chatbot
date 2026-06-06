import { NextResponse } from 'next/server';
import { 
  getTimetable, 
  searchCourses, 
  getNotifications,
  getCourses,
  resetDatabase,
} from '@/lib/db';
import type { Course, Notification, TimetableEntry } from '@/lib/db';

type ChatStructuredData =
  | { type: 'courses'; list: Course[] }
  | { type: 'notifications'; list: Notification[] }
  | { type: 'timetable'; list: TimetableEntry[]; day?: string }
  | { type: 'reset' };

const DAY_MAP_EN_FR: Record<string, string> = {
  'Monday': 'Lundi',
  'Tuesday': 'Mardi',
  'Wednesday': 'Mercredi',
  'Thursday': 'Jeudi',
  'Friday': 'Vendredi',
  'Saturday': 'Samedi',
  'Sunday': 'Dimanche'
};

const DAY_ALIASES: Record<string, string> = {
  'lundi': 'Monday',
  'monday': 'Monday',
  'lun': 'Monday',
  'mardi': 'Tuesday',
  'tuesday': 'Tuesday',
  'mar': 'Tuesday',
  'mercredi': 'Wednesday',
  'wednesday': 'Wednesday',
  'mer': 'Wednesday',
  'jeudi': 'Thursday',
  'thursday': 'Thursday',
  'jeu': 'Thursday',
  'vendredi': 'Friday',
  'friday': 'Friday',
  'ven': 'Friday',
  'samedi': 'Saturday',
  'saturday': 'Saturday',
  'sam': 'Saturday',
  'dimanche': 'Sunday',
  'sunday': 'Sunday',
  'dim': 'Sunday'
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(query: string, terms: string[]) {
  return terms.some(term => query.includes(term));
}

function findRequestedDay(query: string) {
  for (const [alias, dayEn] of Object.entries(DAY_ALIASES)) {
    if (query.includes(alias)) return dayEn;
  }

  const today = new Date();
  const currentDayIndex = today.getDay();
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (includesAny(query, ['aujourd hui', 'ce jour', 'journee'])) {
    return daysEn[currentDayIndex];
  }

  if (query.includes('demain')) {
    return daysEn[(currentDayIndex + 1) % 7];
  }

  return '';
}

function formatTimetableEntry(c: TimetableEntry) {
  return `${c.start_time} - ${c.end_time} : ${c.course_name} (${c.course_id})\nSalle : ${c.room} | Prof : ${c.instructor}`;
}

function cleanChatReply(reply: string) {
  return reply
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/^###\s*/gm, '')
    .replace(/^[ \t]+/gm, '')
    .trim();
}

export async function POST(request: Request) {
  try {
    const { message, audience } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const isTeacher = audience === 'teacher';
    const query = normalizeText(message);
    let reply = '';
    let action: string | undefined;
    let data: ChatStructuredData | undefined;

    // 1. HELP / SALUTATIONS
    if (query === 'bonjour' || query === 'salut' || query === 'hello' || query === 'coucou' || query.includes('aide') || query.includes('help') || query === 'que peux tu faire' || query === '?' ) {
      reply = isTeacher ? `Bonjour, bienvenue sur MADTIME.

Je peux vous aider à consulter le planning publié de la classe Génie Logiciel :

Planning par jour : "planning de lundi", "cours de demain"
Planning semaine : "planning complet", "emploi du temps de la semaine"
Alertes : "alertes", "changements", "notifications"
PDF enseignant : "export pdf", "télécharge le planning"

Cette interface reste dédiée à la consultation du planning publié.`
      : `Bonjour, bienvenue sur MADTIME.

Je peux vous aider sur les fonctionnalités essentielles de la plateforme :

Consultation par jour : "cours de lundi", "j'ai quoi demain ?", "mon horaire aujourd'hui"
Consultation par semaine : "planning complet", "emploi du temps de la semaine"
Alertes de modifications : "alertes", "changements", "notifications"
Téléchargement PDF : "export pdf", "télécharge mon planning"

Vous pouvez écrire naturellement, je m'adapte à votre demande.`;
    }

    // 2. RESET DB
    else if (includesAny(query, ['reinitialise', 'reset', 'remettre a zero', 'recommence'])) {
      resetDatabase();
      reply = isTeacher
        ? `Système réinitialisé. Le planning publié de la classe Génie Logiciel a été restauré.`
        : `Système réinitialisé. L'emploi du temps initial de Mamadou Diallo à l'UGANC a été restauré avec succès.`;
      action = 'refresh_all';
      data = { type: 'reset' };
    }

    // 3. DOWNLOAD PDF
    else if (includesAny(query, ['telecharg', 'download', 'pdf', 'export', 'imprime', 'imprimer', 'document'])) {
      reply = isTeacher
        ? `Téléchargement PDF lancé. Je prépare le planning enseignant MADTIME de la classe Génie Logiciel.`
        : `Téléchargement PDF lancé. Je prépare le document MADTIME de votre emploi du temps publié.`;
      action = 'download_pdf';
    }

    // 4. BLOCK MANUAL TIMETABLE CHANGES
    else if (includesAny(query, ['ajoute', 'programmer', 'inscrire', 'inscription', 'nouveau cours'])) {
      reply = isTeacher
        ? `Le planning enseignant affiché ici est une vue consultative du planning publié. Les ajouts de cours ne sont pas disponibles dans cette interface.`
        : `Les étudiants ne peuvent pas s'inscrire manuellement à un cours dans MADTIME. L'emploi du temps est publié par l'administration et reste consultable ici.`;
    }

    // 5. BLOCK COURSE DELETION
    else if (includesAny(query, ['supprime', 'retire', 'annule', 'enleve'])) {
      reply = isTeacher
        ? `Les cours ne peuvent pas être supprimés depuis cette interface enseignant. Les annulations et changements publiés apparaissent dans les alertes MADTIME.`
        : `Les cours ne peuvent pas être supprimés par les étudiants. Si une annulation ou un changement est publié, il apparaîtra dans les notifications MADTIME.`;
    }

    // 6. NOTIFICATIONS
    else if (includesAny(query, ['notification', 'alerte', 'alertes', 'changement', 'changements', 'modification', 'modifications', 'modif', 'annulation', 'rattrapage', 'message', 'nouvelle info'])) {
      const notifications = getNotifications();
      const unread = notifications.filter(n => n.is_read === 0);
      
      if (notifications.length === 0) {
        reply = isTeacher
          ? `Aucune alerte de modification. Le planning publié de la classe Génie Logiciel est à jour pour le moment.`
          : `Aucune alerte de modification. Votre emploi du temps publié est à jour pour le moment.`;
      } else {
        reply = isTeacher
          ? `Alertes du planning Génie Logiciel\n\n${notifications.length} alertes au total, dont ${unread.length} non lues.\n\n`
          : `Alertes de modifications MADTIME\n\nVous avez ${notifications.length} alertes au total, dont ${unread.length} non lues.\n\n`;
        notifications.forEach((n, index) => {
          const status = n.is_read === 0 ? 'Nouveau' : 'Lu';
          reply += `${index + 1}. ${n.title} (${status})\n${n.message}\n\n`;
        });
      }
      data = { type: 'notifications', list: notifications };
    }

    // 7. SEARCH / VIEW COURSES
    else if (includesAny(query, ['cherche', 'trouve', 'decris', 'description', 'liste des cours', 'quels cours', 'details cours'])) {
      // Check if they want to list all
      if (query.includes('liste des cours') || query.includes('tous les cours') || query.includes('quels cours')) {
        const courses = getCourses();
        reply = isTeacher
          ? `Liste des cours de la classe Génie Logiciel :\n\n`
          : `Liste complète des cours disponibles à l'UGANC (Génie Logiciel) :\n\n`;
        courses.forEach(c => {
          reply += `${c.id} : ${c.name} (${c.department} - ${c.credits} crédits)\n`;
        });
        reply += isTeacher
          ? `\nCes cours sont affichés dans la vue consultative du planning publié.`
          : `\nCes cours sont affichés à titre consultatif. Les inscriptions et affectations sont gérées par l'administration.`;
        data = { type: 'courses', list: courses };
      } else {
        // Extract search term
        let term = '';
        if (query.includes('cherche') || query.includes('trouve')) {
          term = query.replace(/cherche|trouve|les|cours|de|/g, '').trim();
        } else if (query.includes('decris') || query.includes('description')) {
          term = query.replace(/decris|la|description|de|du|cours/g, '').trim();
        }
        
        // Remove code wordings
        term = term.replace(/([a-z]+-\d+)/i, '$1').trim();
        
        if (term.length < 2) {
          reply = `Que souhaitez-vous rechercher ? Précisez un sujet ou un code de cours.
Exemple : "cherche bases de données" ou "décris GL-301"`;
        } else {
          const results = searchCourses(term);
          if (results.length === 0) {
            reply = `Aucun cours trouvé pour la recherche "${term}". Essayez des mots clés comme génie, sécurité, base, web ou un code comme GL-302.`;
          } else if (results.length === 1) {
            const c = results[0];
            reply = `Détails du cours trouvé :
Code : ${c.id}
Nom : ${c.name}
Département : ${c.department}
Crédits : ${c.credits} crédits
Description : ${c.description}

${isTeacher ? 'Ce cours est affiché dans le planning publié de la classe.' : 'Les inscriptions et affectations de cours sont gérées par l\'administration.'}`;
            data = { type: 'courses', list: results };
          } else {
            reply = `J'ai trouvé ${results.length} cours correspondants :\n\n`;
            results.forEach(c => {
              reply += `${c.id} - ${c.name} (${c.credits} crédits)\n${c.description.slice(0, 100)}...\n\n`;
            });
            data = { type: 'courses', list: results };
          }
        }
      }
    }

    // 8. QUERY TIMETABLE (BY DAY OR WEEK)
    else if (includesAny(query, ['emploi', 'planning', 'programme', 'horaire', 'cours', 'classe', 'calendrier', 'aujourd hui', 'demain', 'semaine', 'jour', 'j ai quoi']) || findRequestedDay(query)) {
      const timetable = getTimetable();
      const wantsWeek = includesAny(query, ['semaine', 'hebdo', 'hebdomadaire', 'complet', 'tout le planning', 'planning complet']);
      const targetDayEn = wantsWeek ? '' : findRequestedDay(query);
      const targetDayFr = targetDayEn ? DAY_MAP_EN_FR[targetDayEn] : '';

      if (targetDayEn) {
        const dayClasses = timetable.filter(t => t.day_of_week === targetDayEn);
        if (dayClasses.length === 0) {
          reply = `Emploi du temps du ${targetDayFr}\n\nAucun cours n'est publié pour ce jour.`;
        } else {
          reply = isTeacher
            ? `Planning de la classe Génie Logiciel du ${targetDayFr}\n\n`
            : `Votre emploi du temps du ${targetDayFr}\n\n`;
          dayClasses.forEach(c => { reply += `${formatTimetableEntry(c)}\n\n`; });
        }
        data = { type: 'timetable', list: dayClasses, day: targetDayFr };
      } else {
        // Week view or general query
        if (timetable.length === 0) {
          reply = isTeacher
            ? `Le planning hebdomadaire de la classe Génie Logiciel est vide.
Aucun cours n'est actuellement publié.`
            : `Votre emploi du temps hebdomadaire est vide.
Aucun cours n'est actuellement publié pour votre profil.`;
        } else {
          reply = isTeacher
            ? `Planning de la semaine\n\nVoici le planning publié de la classe Génie Logiciel.\n\n`
            : `Planning de la semaine\n\nVoici l'emploi du temps publié pour Mamadou Diallo, L3 Génie Logiciel.\n\n`;
          
          // Group by day
          const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          daysOrder.forEach(day => {
            const dayClasses = timetable.filter(t => t.day_of_week === day);
            if (dayClasses.length > 0) {
              const dayFr = DAY_MAP_EN_FR[day];
              reply += `${dayFr}\n`;
              dayClasses.forEach(c => { reply += `${formatTimetableEntry(c)}\n`; });
              reply += `\n`;
            }
          });
          
          reply += isTeacher
            ? `Vous pouvez aussi demander un jour précis, par exemple : "planning de lundi".`
            : `Vous pouvez aussi me demander un jour précis, par exemple : "cours de lundi".`;
          data = { type: 'timetable', list: timetable };
        }
      }
    }

    // 9. DEFAULT / I DON'T UNDERSTAND
    else {
      reply = isTeacher ? `Je n'ai pas bien compris votre demande.

Je peux vous aider à :
Consulter le planning de la classe par jour ou par semaine.
Lire les alertes de modifications.
Télécharger le PDF enseignant.

Essayez par exemple : "planning de lundi", "alertes" ou "export pdf".`
      : `Je n'ai pas bien compris votre demande.

Je peux surtout vous aider à :
Consulter le planning par jour ou par semaine.
Lire les alertes de modifications.
Télécharger l'emploi du temps en PDF.

Essayez par exemple : "planning de lundi", "alertes" ou "export pdf".`;
    }

    return NextResponse.json({
      text: cleanChatReply(reply),
      action,
      data
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Chatbot failed to process message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
