// Values of the Notification page (Ionic NotificationPage) that its own SCSS spells as hex colours.
// Citations: [N] = src/pages/notification/notification.scss line (Ionic source).
export const notificationMd = {
  rowBorder: '#ccc', // [N] 5 .notification-list { border-bottom: 1px solid #ccc }
  dateText: '#939393', // [N] 21 span { color }
  unreadBg: '#ebf7ff', // [N] 31 &.new { background }
  ink: '#000', // ion-content text colour ($text-color) for the p
} as const;
