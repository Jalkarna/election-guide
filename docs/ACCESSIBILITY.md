# Accessibility Notes

ElectionGuide is a civic tool, so accessibility is part of the core product requirement.

Implemented practices:

- Keyboard-accessible buttons, sidebar controls, composer actions, and citation controls.
- Visible focus states for buttons and text input.
- `aria-label` and `title` values for icon-only controls.
- Text labels paired with navigation icons where space allows.
- High-contrast neutral palette with saffron accents used sparingly.
- Responsive layout with mobile sidebar controls and safe-area padding.
- Disabled submit states for empty input and in-flight responses.
- Source citations open externally without destroying the chat session.

Manual checks:

- Tab through the sidebar, mobile header, composer, language selector, and send/stop button.
- Confirm focus is visible against the dark theme.
- Confirm icon-only controls expose accessible names.
- Confirm long responses and long user prompts wrap without horizontal scrolling.
- Confirm language selector remains usable on narrow screens.

Known follow-up:

- A full screen-reader pass with NVDA or VoiceOver should be performed before public civic deployment.
