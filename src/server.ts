import express from "express";
import cookieSession from "cookie-session";
import bodyParser from "body-parser";
import { getListeDeputesJSON } from "./getListeDeputes";
import { IDeputes as Deputes } from "./IDeputes";

(async () => {
	const app = express();
	app.use(
		cookieSession({
			name: "session",
			keys: ["key1", "key2"],
			maxAge: 3600 * 1000, // 1hr
		})
	);

	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());

	app.set("views", "views");
	app.set("view engine", "ejs");

	console.time("getListeDeputesJSON");
	const deputes = await getListeDeputesJSON();
	console.timeEnd("getListeDeputesJSON");

	app.get("/play", (req, res) => {
		const { depute, question } = getRandomQuestion(deputes);
		question.reponses = shuffle([question.answer, ...question.baits]);
		res.render("play", { imageUrl: depute.imageUrl, question: question, depIdx: deputes.indexOf(depute), isCorrect: undefined });
	});

	app.post("/play", (req, res) => {
		// console.log(req.body);
		const depute = deputes[parseInt(req.body.dep)];
		const question = depute?.questions?.find((q) => q.question === req.body.question);
		if (question) {
			const isCorrect = depute[question.question as keyof Deputes] === question.reponses![req.body.answer] ?? false;
			res.render("play", { imageUrl: depute.imageUrl, question: question, depIdx: deputes.indexOf(depute), isCorrect: isCorrect });
		} else {
			res.render("play", { imageUrl: depute.imageUrl, question: question, depIdx: deputes.indexOf(depute), isCorrect: false });
		}
	});

	app.use("/", express.static("./public"));
	app.use("/assets", express.static("./assets"));

	const port = process.env.PORT ?? 8080;

	app.listen(port, () => {
		console.log(`Server started on port ${port}`);
	});
})();

function getRandomQuestion(deputes: Deputes[]) {
	const depute = deputes[Math.floor(Math.random() * deputes.length)];
	const question = depute.questions[Math.floor(Math.random() * depute.questions.length)];
	return { depute, question };
}

function shuffle(array : any[]) {
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}
