// Values of the AddNewComplaint page (add-new-complaint.html) that come from global rules of src/theme/variables.scss.
// Screens cannot spell hex colours (lint rule). Citations: [T] variables.scss line (Ionic source). NOTE: added for the AddNewComplaint screen.
import { scssColors } from './index';

export const addNewComplaintMd = {
  // [T] 2450-2460 `.enquiry-btn.add-btns button { height: 45px; background-color: #359C38 !important; box-shadow: none; border-radius: 0 }`:
  // it beats `.green-color` (specificity 0,2,1 against 0,1,0, both !important); `.h40 { height: 40px !important }` beats the 45px.
  submitBackground: '#359C38',
  submitHeight: 40,
  // [T] 2419-2431 `.enquiry-btn button span p { font-size: 14px; letter-spacing: 2px; color: $white }`
  submitFontSize: 14,
  submitLetterSpacing: 2,
  submitMarginTop: 20, // `.mt20`
  // [T] 9954-9962 `.cs-heading1 { padding: 0 16px; padding-top: 16px }` + `.pl0` (padding-left 0 !important) + `.pb10`
  headingPaddingTop: 16,
  headingPaddingBottom: 10,
  headingFontSize: 13, // `.cs-heading1 p { font-size: 13px; font-weight: 500; font-style: italic; text-transform: uppercase }`
  headingWeight: 500,
  // [T] 2570-2640 `.add-new .uplode-image ul li`
  tile: { size: 90, radius: 7, background: '#002d25', marginHorizontal: 4, marginBottom: 7 },
  // the inline-block baseline leaves the line box's descender gap (about 4px) below every row of tiles
  tileRowGap: 4,
  // the single white space the template leaves between the last picture tile and the camera tile (14px Roboto space)
  tileSpace: 3.46,
  removeButton: { size: 22, right: -1, iconSize: 16, background: scssColors.danger, icon: scssColors.white }, // `button` in the tile
  cameraIcon: scssColors.white, // `.other a i { color: $white }`
  tilesPerRow: 3, // (328 content width) / (90 + 8)
} as const;
