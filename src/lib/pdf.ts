import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RowInput } from 'jspdf-autotable';
import { TimetableEntry } from './db';

const DAY_MAP_EN_FR: Record<string, string> = {
  'Monday': 'Lundi',
  'Tuesday': 'Mardi',
  'Wednesday': 'Mercredi',
  'Thursday': 'Jeudi',
  'Friday': 'Vendredi',
  'Saturday': 'Samedi',
  'Sunday': 'Dimanche'
};

type PdfAudience = 'student' | 'teacher';

export function exportTimetableToPdf(entries: TimetableEntry[], audience: PdfAudience = 'student') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const ink: [number, number, number] = [31, 42, 39];
  const muted: [number, number, number] = [94, 112, 105];
  const softText: [number, number, number] = [122, 138, 133];
  const accent: [number, number, number] = [39, 39, 42];
  const accentSoft: [number, number, number] = [236, 236, 234];
  const paperSoft: [number, number, number] = [246, 248, 245];
  const border: [number, number, number] = [219, 228, 222];
  const rowAlt: [number, number, number] = [251, 252, 251];
  const isTeacher = audience === 'teacher';
  const badgeText = isTeacher ? 'Espace enseignant' : 'Licence 3 Génie Logiciel';
  const primaryLabel = isTeacher ? 'Enseignant' : 'Étudiant';
  const primaryValue = isTeacher ? 'Enseignant MADTIME' : 'Mamadou Diallo';
  const periodLabel = isTeacher ? 'Vue' : 'Période';
  const periodValue = isTeacher ? 'Consultation publiée' : '2025-2026';
  const footerText = isTeacher ? 'MADTIME · Planning enseignant UGANC' : 'MADTIME · Emploi du temps UGANC';
  const fileName = isTeacher ? 'MADTIME_planning_enseignant_UGANC.pdf' : 'MADTIME_emploi_du_temps_UGANC.pdf';

  doc.setFillColor(paperSoft[0], paperSoft[1], paperSoft[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 8, pageWidth - 24, 16, 3, 3, 'F');
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.roundedRect(12, 8, pageWidth - 24, 16, 3, 3, 'S');

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(18, 11.5, 9, 9, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('MT', 20.1, 17.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text('MADTIME', 32, 14.4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text('Université Gamal Abdel Nasser de Conakry · Emploi du temps publié', 32, 19.3);

  doc.setFillColor(accentSoft[0], accentSoft[1], accentSoft[2]);
  const levelBadgeWidth = 50;
  const levelBadgeX = pageWidth - 18 - levelBadgeWidth;
  doc.roundedRect(levelBadgeX, 12, levelBadgeWidth, 7, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(badgeText, levelBadgeX + levelBadgeWidth / 2, 16.5, { align: 'center' });

  const totalCourses = entries.length;
  const daysCount = new Set(entries.map(entry => entry.day_of_week)).size;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 27, pageWidth - 24, 7, 2.5, 2.5, 'F');
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.roundedRect(12, 27, pageWidth - 24, 7, 2.5, 2.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(softText[0], softText[1], softText[2]);
  doc.text(primaryLabel, 18, 31.6);
  doc.text(periodLabel, 86, 31.6);
  doc.text('Synthèse', 174, 31.6);
  doc.text('Généré le', pageWidth - 66, 31.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(primaryValue, 30, 31.6);
  doc.text(periodValue, 99, 31.6);
  doc.text(`${totalCourses} cours · ${daysCount} jours`, 188, 31.6);
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 48, 31.6);

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const groupedRows: RowInput[] = daysOrder.flatMap(day => {
    const dayEntries = entries.filter(entry => entry.day_of_week === day);
    if (dayEntries.length === 0) return [];

    return [
      [
        {
          content: DAY_MAP_EN_FR[day] || day,
          colSpan: 5,
          styles: {
            fillColor: accentSoft,
            textColor: accent,
            fontStyle: 'bold' as const,
            halign: 'left' as const,
            cellPadding: { top: 1.1, right: 2, bottom: 1.1, left: 3 },
          }
        }
      ],
      ...dayEntries.map(entry => [
        `${entry.start_time} - ${entry.end_time}`,
        entry.course_id,
        entry.course_name || '',
        entry.room,
        entry.instructor
      ])
    ];
  });

  autoTable(doc, {
    head: [['Horaire', 'Code', 'Cours', 'Salle', 'Enseignant']],
    body: groupedRows,
    startY: 39,
    theme: 'plain',
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      cellPadding: { top: 1.7, right: 2.5, bottom: 1.7, left: 2.5 },
      lineColor: border,
      lineWidth: 0.2
    },
    bodyStyles: {
      fontSize: 7,
      textColor: ink,
      cellPadding: { top: 1.55, right: 2.5, bottom: 1.55, left: 2.5 },
      lineColor: border,
      lineWidth: 0.15
    },
    alternateRowStyles: {
      fillColor: rowAlt
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', textColor: accent },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 91 },
      3: { cellWidth: 47 },
      4: { cellWidth: 55 }
    },
    margin: { left: 12, right: 12 },
    didDrawPage: (data) => {
      doc.setDrawColor(border[0], border[1], border[2]);
      doc.line(12, pageHeight - 15, pageWidth - 12, pageHeight - 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(softText[0], softText[1], softText[2]);
      doc.text(footerText, 12, pageHeight - 9);

      const pageNum = `Page ${data.pageNumber}`;
      doc.text(pageNum, pageWidth - 25, pageHeight - 9);
    }
  });

  doc.save(fileName);
}

export function exportTeacherTimetableToPdf(entries: TimetableEntry[]) {
  exportTimetableToPdf(entries, 'teacher');
}
