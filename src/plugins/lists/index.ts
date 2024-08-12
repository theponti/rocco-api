import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

// Routes
import deleteListRoute from "./delete";
import getListInvitesRoute from "./invites";
import { deleteListItemRoute, getListRoute } from "./list";
import getListsRoute from "./lists";
import postListRoute from "./post";
import acceptListInviteRoute from "./post/acceptInvite";
import putListRoute from "./put";

// Cron jobs
// import addPhotoToPlaces from "./crons/addPhotoToPlaces";
// import migrateLatLngFloat from "./crons/migrateLatLngFloat";

const listsPlugin: FastifyPluginAsync = async (server) => {
	acceptListInviteRoute(server);
	deleteListRoute(server);
	deleteListItemRoute(server);
	getListRoute(server);
	getListInvitesRoute(server);
	getListsRoute(server);
	postListRoute(server);
	putListRoute(server);

	// Cron jobs
	// if (process.env.NODE_ENV !== "test") {
		// addPhotoToPlaces(server).catch((err) => {
		//   console.error("Error adding photo to place", err);
		// });
		// migrateLatLngFloat(server).catch((err) => {
		//   console.error("Error migrating lat and lng", err);
		// });
	// }
};

export default fastifyPlugin(listsPlugin);
