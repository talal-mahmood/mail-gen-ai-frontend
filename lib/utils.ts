import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEmailContent(data: any) {
  // 1) Convert newlines to <br>, then replace only valid markdown links:
  //    [some text](https://some-url)
  //    This avoids grabbing bracketed text with no ( ) afterwards.
  const formattedEmail = data.email
    .replace(/\n/g, '<br>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank">$1</a>'
    );

  // 2) Split into lines
  const emailLines = formattedEmail.split('<br>');

  // 3) Extract header, subject, footer
  const header = emailLines[0].replace('FROM: ', '');
  const subject = emailLines[1].replace('SUBJECT: ', '');
  const footer = emailLines.slice(-4).join('<br>');

  // 4) Main content is everything between line 3 and the last four lines
  const mainContentLines = emailLines.slice(3, -4);

  // 5) Find and remove the first CTA link
  let ctaLink = '';
  const ctaIndex = mainContentLines.findIndex((line: string) =>
    line.includes('<a href="https://')
  );
  if (ctaIndex > -1) {
    [ctaLink] = mainContentLines.splice(ctaIndex, 1);
  }

  // 6) If we have a CTA, apply “button” styling to the <a> tag
  let styledCTA = '';
  if (ctaLink) {
    styledCTA = ctaLink
      .replace('<a href="', '<a href="')
      .replace(
        'target="_blank">',
        'style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; margin: 15px 0;" target="_blank">'
      );
  }

  // 7) Build the final email HTML
  const htmlOutput = `
    <div style="
      max-width: 600px;
      margin: 0 auto;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    ">
      <div style="
        background-color: #f8f9fa;
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
      ">
        <!-- Email Header -->
        ${header}
      </div>
    
      <div style="padding: 30px 20px;">
        <!-- Subject Line -->
        <h1 style="
          color: #2d3748;
          font-size: 24px;
          margin: 0 0 25px 0;
          font-weight: 600;
        ">
          ${subject}
        </h1>
    
        <!-- Main Content -->
        <div style="
          color: #4a5568;
          font-size: 16px;
          margin-bottom: 30px;
        ">
          ${mainContentLines.join('<br>')}
        </div>
    
        ${styledCTA}
      </div>
    
      <!-- Email Footer -->
      <div style="
        background-color: #f8f9fa;
        padding: 20px;
        text-align: center;
        font-size: 14px;
        color: #718096;
        border-top: 1px solid #e9ecef;
      ">
        ${footer}
      </div>
    </div>
  `;

  return htmlOutput;
}

export function convertEmailMarkdownToHtml(emailObj: {
  email: string;
}): string {
  // Clean the markdown content
  const markdown = emailObj.email
    .replace(/^markdown\\n/, '') // Remove starting "markdown\n"
    .replace(/\\n/g, '\n') // Convert escaped newlines
    .replace(/\\"/g, '"') // Unescape quotes
    .trim();

  // Convert markdown elements to HTML
  return (
    markdown
      // Headers (FROM/SUBJECT)
      .replace(
        /^(FROM:)(.*)$/gm,
        '<h2 style="color: #2d3748; font-size: 1.25rem; margin-bottom: 0.5rem;">$1 <span style="font-weight: 600;">$2</span></h2>'
      )
      .replace(
        /^(SUBJECT:)(.*)$/gm,
        '<h1 style="color: #1a365d; font-size: 1.5rem; margin-bottom: 1rem;">$1<span style="color: #4299e1;">$2</span></h1>'
      )

      // Links
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" style="color: #4299e1; text-decoration: underline;">$1</a>'
      )

      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

      // Line breaks and paragraphs
      .split('\n\n')
      .map((paragraph) => {
        if (paragraph.trim() === '') return '';
        return `<p style="margin-bottom: 1rem; line-height: 1.5; color: #4a5568;">${paragraph}</p>`;
      })
      .join('\n')

      // Preserve single newlines within paragraphs
      .replace(/\n/g, '<br/>')
  );
}
