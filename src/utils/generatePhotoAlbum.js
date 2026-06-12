import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign,
} from 'docx'

const PAGE_W = 11906
const PAGE_H = 16838
const MARGIN = 720
const CON_W  = PAGE_W - MARGIN * 2

const SN_W    = 500
const PHOTO_W = 2700
const DET_W   = CON_W - SN_W - PHOTO_W

const IMG_W = 90
const IMG_H = 115

const hB = { style: BorderStyle.SINGLE, size: 8, color: '0a1628' }
const cB = { style: BorderStyle.SINGLE, size: 2, color: 'c8d3e0' }
const hBs = { top: hB, bottom: hB, left: hB, right: hB }
const cBs = { top: cB, bottom: cB, left: cB, right: cB }

function tc(children, w, shade, borders) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: borders || cBs,
    verticalAlign: VerticalAlign.CENTER,
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children,
  })
}

function p(runs, align) {
  return new Paragraph({
    alignment: align || AlignmentType.LEFT,
    spacing: { before: 30, after: 30 },
    children: Array.isArray(runs) ? runs : [runs],
  })
}

function r(text, opts = {}) {
  return new TextRun({
    text, font: 'Arial',
    size: opts.size || 18,
    bold: opts.bold || false,
    color: opts.color || '1e293b',
  })
}

async function fetchImage(url) {
  if (!url) return null
  try {
    const clean = url.split('?')[0]
    const res = await fetch(clean, { mode: 'cors' })
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch { return null }
}

function imgType(url) {
  const u = (url || '').toLowerCase().split('?')[0]
  if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'jpg'
  if (u.endsWith('.gif')) return 'gif'
  return 'png'
}

export async function generatePhotoAlbum(students) {
  const titleRow = new TableRow({
    children: [new TableCell({
      columnSpan: 3,
      width: { size: CON_W, type: WidthType.DXA },
      borders: hBs,
      shading: { fill: '0a1628', type: ShadingType.CLEAR },
      margins: { top: 200, bottom: 200, left: 240, right: 240 },
      children: [
        p(r('IDEAS-TVET INITIATIVE', { bold: true, size: 30, color: 'ffffff' }), AlignmentType.CENTER),
        p(r('Computer Hardware & Cellphone Repairs Training Program', { size: 19, color: '2db84b' }), AlignmentType.CENTER),
        p(r('STUDENT PHOTO ALBUM', { bold: true, size: 26, color: 'ffffff' }), AlignmentType.CENTER),
        p(r(`Plateau State Polytechnic, Jos  ·  Web3.0 Alliance Ltd  ·  ${new Date().getFullYear()}`, { size: 15, color: '8899aa' }), AlignmentType.CENTER),
      ],
    })],
  })

  const headRow = new TableRow({
    tableHeader: true,
    children: [
      tc([p(r('S/N',        { bold: true, size: 20 }), AlignmentType.CENTER)], SN_W,    'dde6f0', hBs),
      tc([p(r('Photograph', { bold: true, size: 20 }), AlignmentType.CENTER)], PHOTO_W, 'dde6f0', hBs),
      tc([p(r('Details',    { bold: true, size: 20 }), AlignmentType.CENTER)], DET_W,   'dde6f0', hBs),
    ],
  })

  const dataRows = await Promise.all(students.map(async (s, i) => {
    const shade = i % 2 === 0 ? 'f5f8fc' : 'ffffff'

    // Photo
    let photoCell
    const buf = await fetchImage(s.photo_url)
    if (buf && buf.length > 200) {
      photoCell = tc([
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 },
          children: [new ImageRun({
            data: buf,
            type: imgType(s.photo_url),
            transformation: { width: IMG_W, height: IMG_H },
          })],
        }),
      ], PHOTO_W, shade)
    } else {
      photoCell = tc([
        p(r('No photo', { color: '94a3b8', size: 15 }), AlignmentType.CENTER),
        p(r('uploaded',  { color: '94a3b8', size: 15 }), AlignmentType.CENTER),
      ], PHOTO_W, shade)
    }

    const dob = s.date_of_birth
      ? new Date(s.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A'

    const detailParas = [
      ['Full Name',     s.full_name       || 'N/A'],
      ['Gender',        s.gender          || 'N/A'],
      ['Date of Birth', dob],
      ['Phone',         s.phone           || 'N/A'],
      ['NIN',           s.nin             || 'N/A'],
      ['Email',         s.email           || 'N/A'],
      ['State',         s.state_of_origin || 'N/A'],
      ['LGA',           s.lga             || 'N/A'],
    ].map(([lbl, val]) => new Paragraph({
      spacing: { before: 28, after: 28 },
      children: [
        new TextRun({ text: `${lbl}: `, font: 'Arial', size: 17, bold: true,  color: '0a1628' }),
        new TextRun({ text: val,         font: 'Arial', size: 17, bold: false, color: '334155' }),
      ],
    }))

    return new TableRow({
      children: [
        tc([p(r(String(i + 1), { bold: true, size: 20 }), AlignmentType.CENTER)], SN_W, shade),
        photoCell,
        tc(detailParas, DET_W, shade),
      ],
    })
  }))

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 140 },
          children: [new TextRun({
            text: `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  Total Trainees: ${students.length}`,
            font: 'Arial', size: 15, color: '94a3b8',
          })],
        }),
        new Table({
          width: { size: CON_W, type: WidthType.DXA },
          columnWidths: [SN_W, PHOTO_W, DET_W],
          rows: [titleRow, headRow, ...dataRows],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240 },
          children: [new TextRun({
            text: 'IDEAS-TVET Initiative  ·  Web3.0 Alliance Ltd  ·  Contract: IDEAS-TVET2/NPCU/PLATEAU/05.26/304',
            font: 'Arial', size: 14, color: '94a3b8',
          })],
        }),
      ],
    }],
  })

  return Packer.toBlob(doc)
}