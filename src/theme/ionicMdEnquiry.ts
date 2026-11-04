// Values of the Enquiry page (enquiry.html) that come from the global `.enquriy` / `.enquiry-btn.tranparnt-btn` rules of
// src/theme/variables.scss (shipped main.css). Screens cannot spell hex colours (lint rule). Citations: [T] variables.scss line.
// NOTE: added for the Enquiry screen.
export const enquiryMd = {
  // [T] 2344-2349 `.enquriy { padding: 16px 32px } .enquriy p { font-size: 15px; line-height: 24px }`
  padding: { vertical: 16, horizontal: 32 },
  p: { fontSize: 15, lineHeight: 24 },
  // [T] 2355-2362 `.enquriy .cs-form ion-list ion-item.cs-input { height: 45px; margin: 16px 0 30px; box-shadow: 3px 3px 1px 1px rgba(0,0,0,.2) !important }`
  item: { height: 45, marginTop: 16, marginBottom: 30, boxShadow: '3px 3px 1px 1px rgba(0, 0, 0, 0.2)' },
  // `.h100 { height: 100px !important }` (main.css utility class) on the message item
  tallItemHeight: 100,
  // [T] 2381-2386 `ion-input input { padding-left 13; padding-right 13; padding-top 15; width 100%; margin 0 }`: NO font-size (the item's 16px)
  inputFontSize: 16,
  inputPaddingTop: 15,
  // [T] 2419-2447 `.enquiry-btn.tranparnt-btn button`: 100% x 46, transparent, border 2px solid #31a700, no shadow; `span p`: 14px, letter-spacing 2px, #31a700
  button: { height: 46, borderWidth: 2, color: '#31a700', fontSize: 14, letterSpacing: 2 },
} as const;
