import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { taskTitle, createdAt, deadline, type, userEmail } = await req.json()

    // Setup Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'placeholder@gmail.com',
        pass: process.env.EMAIL_PASS || 'placeholder_app_password',
      },
    })

    const isThirtyMin = type === '30_MIN'
    const subject = isThirtyMin 
      ? `Upcoming Deadline: ${taskTitle}` 
      : `Deadline Reached: ${taskTitle}`

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; padding: 32px; background-color: #ffffff;">
        <h2 style="color: #111111; margin-bottom: 24px; font-weight: 800;">
          ${isThirtyMin ? 'A task is due soon!' : 'Your task deadline has passed!'}
        </h2>
        
        <div style="background-color: #f7f7f8; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #111111;">${taskTitle}</p>
        </div>

        <p style="color: #666666; margin-bottom: 8px;"><strong>Created:</strong> ${new Date(createdAt).toLocaleString()}</p>
        <p style="color: ${(isThirtyMin ? '#eab308' : '#ef4444')}; margin-bottom: 24px;">
          <strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}
        </p>

        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888888; text-align: center;">
          Log into FOCUS to mark this task as resolved in your checklist.
        </p>
      </div>
    `

    // Mock response if credentials are not provided in ENV
    if (!process.env.EMAIL_USER) {
      console.log('\n--- ✉️ MOCK EMAIL DISPATCH ---')
      console.log('To:', userEmail)
      console.log('Subject:', subject)
      console.log('Target API Hit Successfully. Setup EMAIL_USER in .env.local to send native emails.')
      console.log('-------------------------------\n')
      
      return NextResponse.json({ success: true, mocked: true })
    }

    const info = await transporter.sendMail({
      from: `"FOCUS Notifier" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error('Email Dispatch Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
