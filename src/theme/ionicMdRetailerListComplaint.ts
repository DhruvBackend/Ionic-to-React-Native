// Values of the RetailerListComplaint page that come from global rules of src/theme/variables.scss. [T] = variables.scss line.
// NEW FILE added by the RetailerListComplaint port (screens cannot spell hex or a phone number: the lint rule).
export const retailerListComplaintMd = {
  botmBackground: '#f2f2f2', // [T] 12433 `.cs-list .botm-block { background }`
  // html:18 the mock card's number (static markup in Ionic, not client data)
  mockNumber: '9999231274',
} as const;
