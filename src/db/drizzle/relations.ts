import { relations } from "drizzle-orm/relations";
import { user, account, bookmark, chat, chatMessage, flight, list, idea, item, token, movie, movieViewings, place, session, userLists, listInvite } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	bookmarks: many(bookmark),
	chats: many(chat),
	chatMessages: many(chatMessage),
	flights: many(flight),
	lists: many(list),
	ideas: many(idea),
	items: many(item),
	tokens: many(token),
	movieViewings: many(movieViewings),
	places: many(place),
	sessions: many(session),
	userLists: many(userLists),
	listInvites_invitedUserId: many(listInvite, {
		relationName: "listInvite_invitedUserId_user_id"
	}),
	listInvites_userId: many(listInvite, {
		relationName: "listInvite_userId_user_id"
	}),
}));

export const bookmarkRelations = relations(bookmark, ({one}) => ({
	user: one(user, {
		fields: [bookmark.userId],
		references: [user.id]
	}),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	chatMessages: many(chatMessage),
}));

export const chatMessageRelations = relations(chatMessage, ({one}) => ({
	chat: one(chat, {
		fields: [chatMessage.chatId],
		references: [chat.id]
	}),
	user: one(user, {
		fields: [chatMessage.userId],
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

export const ideaRelations = relations(idea, ({one}) => ({
	user: one(user, {
		fields: [idea.userId],
		references: [user.id]
	}),
}));

export const itemRelations = relations(item, ({one, many}) => ({
	list: one(list, {
		fields: [item.listId],
		references: [list.id]
	}),
	user: one(user, {
		fields: [item.userId],
		references: [user.id]
	}),
	places: many(place),
}));

export const tokenRelations = relations(token, ({one}) => ({
	user: one(user, {
		fields: [token.userId],
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

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
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