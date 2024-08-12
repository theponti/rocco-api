import { relations } from "drizzle-orm/relations";
import { user, token, account, session, idea, bookmark, flight, list, place, item, movie, movieViewings, userLists, listInvite } from "./schema";

export const tokenRelations = relations(token, ({one}) => ({
	user: one(user, {
		fields: [token.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	tokens: many(token),
	accounts: many(account),
	sessions: many(session),
	ideas: many(idea),
	bookmarks: many(bookmark),
	flights: many(flight),
	lists: many(list),
	places: many(place),
	items: many(item),
	movieViewings: many(movieViewings),
	userLists: many(userLists),
	listInvites_invitedUserId: many(listInvite, {
		relationName: "listInvite_invitedUserId_user_id"
	}),
	listInvites_userId: many(listInvite, {
		relationName: "listInvite_userId_user_id"
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const ideaRelations = relations(idea, ({one}) => ({
	user: one(user, {
		fields: [idea.userId],
		references: [user.id]
	}),
}));

export const bookmarkRelations = relations(bookmark, ({one}) => ({
	user: one(user, {
		fields: [bookmark.userId],
		references: [user.id]
	}),
}));

export const flightRelations = relations(flight, ({one}) => ({
	user: one(user, {
		fields: [flight.userId],
		references: [user.id]
	}),
	list: one(list, {
		fields: [flight.listId],
		references: [list.id]
	}),
}));

export const listRelations = relations(list, ({one, many}) => ({
	flights: many(flight),
	user: one(user, {
		fields: [list.userId],
		references: [user.id]
	}),
	items: many(item),
	userLists: many(userLists),
	listInvites: many(listInvite),
}));

export const placeRelations = relations(place, ({one}) => ({
	user: one(user, {
		fields: [place.userId],
		references: [user.id]
	}),
	item: one(item, {
		fields: [place.itemId],
		references: [item.id]
	}),
}));

export const itemRelations = relations(item, ({one, many}) => ({
	places: many(place),
	list: one(list, {
		fields: [item.listId],
		references: [list.id]
	}),
	user: one(user, {
		fields: [item.userId],
		references: [user.id]
	}),
}));

export const movieViewingsRelations = relations(movieViewings, ({one}) => ({
	movie: one(movie, {
		fields: [movieViewings.movieId],
		references: [movie.id]
	}),
	user: one(user, {
		fields: [movieViewings.userId],
		references: [user.id]
	}),
}));

export const movieRelations = relations(movie, ({many}) => ({
	movieViewings: many(movieViewings),
}));

export const userListsRelations = relations(userLists, ({one}) => ({
	list: one(list, {
		fields: [userLists.listId],
		references: [list.id]
	}),
	user: one(user, {
		fields: [userLists.userId],
		references: [user.id]
	}),
}));

export const listInviteRelations = relations(listInvite, ({one}) => ({
	list: one(list, {
		fields: [listInvite.listId],
		references: [list.id]
	}),
	user_invitedUserId: one(user, {
		fields: [listInvite.invitedUserId],
		references: [user.id],
		relationName: "listInvite_invitedUserId_user_id"
	}),
	user_userId: one(user, {
		fields: [listInvite.userId],
		references: [user.id],
		relationName: "listInvite_userId_user_id"
	}),
}));