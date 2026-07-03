import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function markdownToEmailHtml(markdown: string): string {
  const body = marked.parse(markdown) as string;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      h1,h2,h3 { color:#0f172a; margin-top:1.1em; margin-bottom:.45em; line-height:1.25; }
      p { margin:.55em 0; }
      ul,ol { margin:.6em 0 .9em 1.2em; padding:0; }
      table { width:100%; border-collapse:collapse; margin:14px 0; font-size:14px; }
      th,td { border:1px solid #e2e8f0; padding:8px; text-align:left; vertical-align:top; }
      th { background:#f8fafc; font-weight:700; }
      code { background:#f1f5f9; padding:2px 5px; border-radius:4px; }
      pre { background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px; overflow:auto; }
      blockquote { margin:.8em 0; padding:.4em .8em; border-left:4px solid #cbd5e1; color:#334155; }
      a { color:#2563eb; text-decoration:underline; }
      hr { border:none; border-top:1px solid #e2e8f0; margin:18px 0; }
    </style>
  </head>
  <body style="margin:0; padding:24px; background:#f8fafc; color:#0f172a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif; line-height:1.5;">
    <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
      <div style="background:#0b0f14; border-bottom:1px solid rgba(255,255,255,0.12); padding:18px 22px;">
        <img
          src="https://bvb.differentialfactor.com/images/df-logo-full.jpg"
          alt="Differential Factor"
          style="display:block; height:68px; width:auto; max-width:520px; object-fit:contain;"
        />
      </div>
      <div style="padding:24px;">
      ${body}
      </div>
    </div>
  </body>
</html>`;
}
