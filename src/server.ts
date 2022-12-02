import express from "express";
import { createServer } from "http";
import { getListeDeputesJSON } from "./getListeDeputes";
import { IDeputes as Deputes } from "./IDeputes";

(async () => {
	const app = express();
	const httpServer = createServer(app);

	app.set("views", "views");
	app.set("view engine", "ejs");

	console.time("getListeDeputesJSON");
	const deputes = await getListeDeputesJSON();
	console.timeEnd("getListeDeputesJSON");

	app.get("/play", (req, res) => {
		const { depute, question } = getRandomQuestion(deputes);
		console.log(depute, question);
		question.reponses = [question.answer, ...question.baits].sort(() => Math.round(Math.random()));
		res.render("play", { imageUrl: depute.imageUrl, question: question });
	});

	app.use("/", express.static("./public"));
	app.use("/assets", express.static("./assets"));

	const port = process.env.PORT ?? 8080;

	httpServer.listen(port, () => {
		console.log(`Server started on port ${port}`);
	});
})();

function getRandomQuestion(deputes: Deputes[]) {
	const depute = deputes[Math.floor(Math.random() * deputes.length)];
	const question = depute.questions[Math.floor(Math.random() * depute.questions.length)];
	return { depute, question };
}
