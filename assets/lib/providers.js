export const PROVIDERS = [
  {
    id: "spotify",
    name: "Spotify",
    aliases: ["spotify", "spotify ab"],
    cancelUrl: "https://support.spotify.com/article/cancel-premium/",
    linkLabel: "Spotify cancellation guide",
  },
  {
    id: "netflix",
    name: "Netflix",
    aliases: ["netflix", "netflix com"],
    cancelUrl: "https://help.netflix.com/node/407",
    linkLabel: "Netflix cancellation guide",
  },
  {
    id: "adobe",
    name: "Adobe",
    aliases: ["adobe", "adobe systems"],
    cancelUrl: "https://helpx.adobe.com/manage-account/using/cancel-subscription.html",
    linkLabel: "Adobe cancellation guide",
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    aliases: ["microsoft", "msbill info", "microsoft 365"],
    cancelUrl: "https://support.microsoft.com/en-us/accounts-billing/subscriptions/cancel-your-microsoft-subscription",
    linkLabel: "Microsoft cancellation guide",
  },
  {
    id: "apple",
    name: "Apple services",
    aliases: ["apple com bill", "itunes com bill", "apple services"],
    cancelUrl: "https://support.apple.com/118428",
    linkLabel: "Apple cancellation guide",
  },
  {
    id: "google",
    name: "Google subscriptions",
    aliases: ["google", "google storage", "google youtube", "google play"],
    cancelUrl: "https://support.google.com/googleplay/answer/7018481",
    linkLabel: "Google cancellation guide",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    aliases: ["dropbox"],
    cancelUrl: "https://help.dropbox.com/plans/cancel-mobile",
    linkLabel: "Dropbox cancellation guide",
  },
  {
    id: "canva",
    name: "Canva",
    aliases: ["canva"],
    cancelUrl: "https://www.canva.com/help/cancel-canva-plan/",
    linkLabel: "Canva cancellation guide",
  },
];

export function findProvider(normalizedMerchant) {
  return PROVIDERS.find((provider) =>
    provider.aliases.some(
      (alias) => normalizedMerchant === alias || normalizedMerchant.startsWith(`${alias} `),
    ),
  );
}
