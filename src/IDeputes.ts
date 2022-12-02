export interface IDeputes {
	"Code du département": string;
	"Libellé du département": string;
	"Code de la collectivité à statut particulier": string;
	"Libellé de la collectivité à statut particulier": string;
	"Code de la circonscription législative": string;
	"Libellé de la circonscription législative": string;
	"Nom de l'élu": string;
	"Prénom de l'élu": string;
	"Code sexe": string;
	"Date de naissance": string;
	"Code de la catégorie socio-professionnelle": string;
	"Libellé de la catégorie socio-professionnelle": string;
	"Date de début du mandat": string;
	imageUrl: string;
	"Nom et Prénom": string;
	questions: Array<{
		reponses?: string[];
		question: string;
		answer: string;
		baits: string[];
	}>;
}
