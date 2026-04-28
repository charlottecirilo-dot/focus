import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import PDFParser from 'pdf2json'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    if (file.name.endsWith('.pdf')) {
      extractedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1 as any)
        pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError))
        pdfParser.on('pdfParser_dataReady', () => {
          resolve((pdfParser as any).getRawTextContent())
        })
        pdfParser.parseBuffer(buffer)
      })
    } else if (file.name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF or DOCX.' }, { status: 400 })
    }

    // Clean up text
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\n+/g, '\n').trim()
    
    return NextResponse.json({ text: extractedText })
  } catch (error: any) {
    console.error('Extraction error:', error)
    return NextResponse.json({ error: error.message || 'Error extracting text' }, { status: 500 })
  }
}
