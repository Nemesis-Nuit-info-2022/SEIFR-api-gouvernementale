import axios from "axios";
import csv from "csvtojson/v2";
import { writeFileSync } from "fs";
import { IDeputes as Deputes } from "./IDeputes";
import { parse } from "node-html-parser";
const https = require("follow-redirects").https;

const capitalize = (s: string) => {
	let letters = s.toLocaleLowerCase().split("");
	for (const letterIdxStr in letters) {
		const letterIdx = parseInt(letterIdxStr);
		if (letterIdx === 0) {
			letters[letterIdx] = letters[letterIdx].toLocaleUpperCase();
		} else if (letterIdx - 1 >= 0 && [" ", "-", ".", "'"].includes(letters[letterIdx - 1])) {
			letters[letterIdx] = letters[letterIdx].toLocaleUpperCase();
		}
	}
	return letters.join("");
};

async function getListeDeputesUrl() {
	return new Promise((resolve, reject) => {
		const options = {
			method: "GET",
			hostname: "www.data.gouv.fr",
			path: "/api/1/datasets/5c34c4d1634f4173183a64f1/",
			headers: {
				Authorization: "",
				"Content-Transfer-Encoding": "application/json",
			},
			maxRedirects: 20,
		};

		var req = https.request(options, function (res: any) {
			var chunks: any[] = [];

			res.on("data", function (chunk: any) {
				chunks.push(chunk);
			});

			res.on("end", function (chunk: any) {
				var body = Buffer.concat(chunks);
				// console.log(body.toString());
				const depFileURL = JSON.parse(body.toString()).resources.find((r: { url: string }) => r.url.endsWith("dep.csv")).url;
				!!depFileURL ? resolve(depFileURL) : reject("File not found");
			});

			res.on("error", function (error: any) {
				reject(error);
			});
		});
		req.end();
	});
}

async function getListeDeputesCSV() {
	const fileUrl = (await getListeDeputesUrl()) as string;
	const { hostname, path } = /(?<=http(?:s| ):\/\/)(?<hostname>.+?)(?=\/)(?<path>.+)/.exec(fileUrl)!.groups!;
	return new Promise((resolve, reject) => {
		const options = {
			method: "GET",
			hostname,
			path,
			headers: {
				Authorization: "",
				"Content-Transfer-Encoding": "application/json",
			},
			maxRedirects: 20,
		};

		var req = https.request(options, function (res: any) {
			var chunks: any[] = [];

			res.on("data", function (chunk: any) {
				chunks.push(chunk);
			});

			res.on("end", function (chunk: any) {
				var body = Buffer.concat(chunks);
				// console.log(body.toString());
				resolve(body.toString());
			});

			res.on("error", function (error: any) {
				reject(error);
			});
		});
		req.end();
	});
}

export async function getListeDeputesJSON() {
	const csvData = await getListeDeputesCSV();
	const csvFilePath = "data.csv";
	await writeFileSync(csvFilePath, csvData as string);
	const jsonArray = (await csv({ delimiter: "\t" }).fromFile(csvFilePath)) as Deputes[];
	let i = 0;
	for await (const dep of jsonArray) {
		dep["Nom et Prénom"] = `${dep["Prénom de l'élu"]} ${dep["Nom de l'élu"]}`;
		await fetchPictureFromWikipedia(dep);
	}
	const filteredArr = jsonArray.filter((d) => !!d.imageUrl);
	await getQuestions(filteredArr);
	return filteredArr;
}

async function fetchPictureFromWikipedia(depute: Deputes) {
	try {
		const { "Nom de l'élu": nom, "Prénom de l'élu": prenom } = depute;
		const url = `https://fr.wikipedia.org/wiki/${capitalize(prenom).replace(/ +/g, "_")} ${capitalize(nom).replace(/ +/g, "_")}`;
		const { data } = await axios.get(url);
		const parsedHtml = parse(data);
		let node = parsedHtml.querySelector(".infobox_v2.noarchive>tbody>tr>td>a>img");
		let pictureUrl = node?.getAttribute("src");

		!!pictureUrl &&
			![
				"//upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Defaut_2.svg/langfr-220px-Defaut_2.svg.png",
				"//upload.wikimedia.org/wikipedia/commons/thumb/8/85/Defaut.svg/langfr-200px-Defaut.svg.png",
				"//upload.wikimedia.org/wikipedia/commons/thumb/8/85/Defaut.svg/langfr-220px-Defaut.svg.png",
				"//upload.wikimedia.org/wikipedia/commons/thumb/3/38/Info_Simple.svg/12px-Info_Simple.svg.png",
			].includes(pictureUrl) &&
			(depute.imageUrl = pictureUrl!.replace("//", ""));
	} catch (err: any) {
		console.error("Error while fetching picture from wikipedia", err.response.status, err.response.statusText, err.request.res.responseUrl);
	}
}

async function getQuestions(listDeputes: Deputes[]) {
	const propertiesUsedToCreateRandomQuestionsAboutDeputes = ["Nom et Prénom", "Code du département", "Date de naissance"];
	for (const d of listDeputes) {
		for (const property of propertiesUsedToCreateRandomQuestionsAboutDeputes) {
			let question: { question: string; answer: string; baits: string[] } = { question: "", answer: "", baits: [] };
			const baits: string[] = [];
			const otherDeputes = listDeputes.filter((d2) => d2 !== d);
			for (let i = 0; i < 3; i++) {
				const randomDepute = otherDeputes[Math.floor(Math.random() * otherDeputes.length)];
				baits.push(randomDepute[property as keyof Deputes] as string);
			}
			question = { question: property, answer: d[property as keyof Deputes] as string, baits };
			if (!d.questions) d.questions = [];
			d.questions.push(question);
		}
	}
}
