import type { ArtworkAssetKey } from './artwork';

/**
 * Ponte entre a chave editorial e o binário empacotado.
 *
 * Isolado de `artwork.ts` por um motivo prático: `require` de `.webp` só existe
 * sob o Metro, então misturar as duas coisas tornaria a regra editorial
 * impossível de testar em Node. Aqui não há decisão nenhuma — só endereço.
 *
 * O `require` estático é obrigatório (o Metro precisa ver o caminho literal
 * para empacotar o arquivo), mas resolver o módulo não decodifica imagem: o
 * custo de pixel só aparece quando um `<Image>` de fato monta na tela.
 */
const ASSETS: Record<ArtworkAssetKey, number> = {
  onboardingTrain: require('../../../assets/marketing/onboarding-train.webp') as number,
  onboardingProgress: require('../../../assets/marketing/onboarding-progress.webp') as number,
  onboardingCoach: require('../../../assets/marketing/onboarding-coach.webp') as number,
  homeWorkout: require('../../../assets/marketing/home-workout.webp') as number,
};

export function artworkAsset(key: ArtworkAssetKey | null): number | undefined {
  return key === null ? undefined : ASSETS[key];
}
