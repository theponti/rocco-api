import { pgTable, uniqueIndex, text, timestamp, uuid, boolean, foreignKey, integer, serial, doublePrecision, primaryKey, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const itemType = pgEnum("ItemType", ['FLIGHT', 'PLACE'])
export const tokenType = pgEnum("TokenType", ['EMAIL', 'API'])



export const verificationToken = pgTable("VerificationToken", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
	return {
		identifierTokenKey: uniqueIndex("VerificationToken_identifier_token_key").using("btree", table.identifier.asc().nullsLast(), table.token.asc().nullsLast()),
		tokenKey: uniqueIndex("VerificationToken_token_key").using("btree", table.token.asc().nullsLast()),
	}
});

export const user = pgTable("User", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: text("email").notNull(),
	name: text("name"),
	isAdmin: boolean("isAdmin").default(false).notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	emailVerified: timestamp("emailVerified", { precision: 3, mode: 'string' }),
	image: text("image"),
},
(table) => {
	return {
		emailKey: uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast()),
	}
});

export const account = pgTable("Account", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("userId").notNull(),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("providerAccountId").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text("scope"),
	idToken: text("id_token"),
	sessionState: text("session_state"),
},
(table) => {
	return {
		providerProviderAccountIdKey: uniqueIndex("Account_provider_providerAccountId_key").using("btree", table.provider.asc().nullsLast(), table.providerAccountId.asc().nullsLast()),
		accountUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Account_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const bookmark = pgTable("Bookmark", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	image: text("image"),
	title: text("title").notNull(),
	description: text("description"),
	imageHeight: text("imageHeight"),
	imageWidth: text("imageWidth"),
	locationAddress: text("locationAddress"),
	locationLat: text("locationLat"),
	locationLng: text("locationLng"),
	siteName: text("siteName").notNull(),
	url: text("url").notNull(),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		bookmarkUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Bookmark_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const chat = pgTable("Chat", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	title: text("title").notNull(),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const chatMessage = pgTable("ChatMessage", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	chatId: uuid("chatId").notNull(),
	userId: uuid("userId").notNull(),
	role: text("role").notNull(),
	content: text("content").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		chatMessageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "ChatMessage_chatId_Chat_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		chatMessageUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ChatMessage_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const flight = pgTable("Flight", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	flightNumber: text("flightNumber").notNull(),
	departureAirport: text("departureAirport").notNull(),
	departureDate: timestamp("departureDate", { mode: 'string' }).notNull(),
	arrivalDate: timestamp("arrivalDate", { mode: 'string' }).notNull(),
	arrivalAirport: text("arrivalAirport").notNull(),
	airline: text("airline").notNull(),
	reservationNumber: text("reservationNumber").notNull(),
	url: text("url").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	userId: uuid("userId").notNull(),
	listId: uuid("listId"),
},
(table) => {
	return {
		flightUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Flight_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		flightListIdListIdFk: foreignKey({
			columns: [table.listId],
			foreignColumns: [list.id],
			name: "Flight_listId_List_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	}
});

export const list = pgTable("List", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		listUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "List_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const idea = pgTable("Idea", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	description: text("description").notNull(),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		ideaUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Idea_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const item = pgTable("Item", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	type: text("type").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	itemId: uuid("itemId").notNull(),
	listId: uuid("listId").notNull(),
	userId: uuid("userId"),
	itemType: itemType("itemType").default('PLACE').notNull(),
},
(table) => {
	return {
		listIdItemIdKey: uniqueIndex("Item_listId_itemId_key").using("btree", table.listId.asc().nullsLast(), table.itemId.asc().nullsLast()),
		itemListIdListIdFk: foreignKey({
			columns: [table.listId],
			foreignColumns: [list.id],
			name: "Item_listId_List_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
		itemUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Item_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	}
});

export const token = pgTable("Token", {
	id: serial("id").primaryKey().notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	type: tokenType("type").notNull(),
	emailToken: text("emailToken"),
	valid: boolean("valid").default(true).notNull(),
	expiration: timestamp("expiration", { precision: 3, mode: 'string' }).notNull(),
	userId: uuid("userId").notNull(),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
},
(table) => {
	return {
		accessTokenKey: uniqueIndex("Token_accessToken_key").using("btree", table.accessToken.asc().nullsLast()),
		emailTokenKey: uniqueIndex("Token_emailToken_key").using("btree", table.emailToken.asc().nullsLast()),
		refreshTokenKey: uniqueIndex("Token_refreshToken_key").using("btree", table.refreshToken.asc().nullsLast()),
		tokenUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Token_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});

export const movie = pgTable("Movie", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	image: text("image").notNull(),
	director: text("director"),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const movieViewings = pgTable("MovieViewings", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	movieId: uuid("movieId").notNull(),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		movieViewingsMovieIdMovieIdFk: foreignKey({
			columns: [table.movieId],
			foreignColumns: [movie.id],
			name: "MovieViewings_movieId_Movie_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		movieViewingsUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MovieViewings_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const place = pgTable("Place", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	address: text("address"),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	userId: uuid("userId").notNull(),
	itemId: uuid("itemId"),
	googleMapsId: text("googleMapsId"),
	types: text("types").array(),
	imageUrl: text("imageUrl"),
	phoneNumber: text("phoneNumber"),
	rating: doublePrecision("rating"),
	websiteUri: text("websiteUri"),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
},
(table) => {
	return {
		placeUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Place_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		placeItemIdItemIdFk: foreignKey({
			columns: [table.itemId],
			foreignColumns: [item.id],
			name: "Place_itemId_Item_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const session = pgTable("Session", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionToken: text("sessionToken").notNull(),
	userId: uuid("userId").notNull(),
	expires: timestamp("expires", { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
	return {
		sessionTokenKey: uniqueIndex("Session_sessionToken_key").using("btree", table.sessionToken.asc().nullsLast()),
		sessionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Session_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const userLists = pgTable("UserLists", {
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	listId: uuid("listId").notNull(),
	userId: uuid("userId").notNull(),
},
(table) => {
	return {
		userListsListIdListIdFk: foreignKey({
			columns: [table.listId],
			foreignColumns: [list.id],
			name: "UserLists_listId_List_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		userListsUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserLists_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		userListsPkey: primaryKey({ columns: [table.listId, table.userId], name: "UserLists_pkey"}),
	}
});

export const listInvite = pgTable("ListInvite", {
	accepted: boolean("accepted").default(false).notNull(),
	listId: uuid("listId").notNull(),
	invitedUserEmail: text("invitedUserEmail").notNull(),
	invitedUserId: uuid("invitedUserId"),
	userId: uuid("userId").notNull(),
},
(table) => {
	return {
		listInviteListIdListIdFk: foreignKey({
			columns: [table.listId],
			foreignColumns: [list.id],
			name: "ListInvite_listId_List_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		listInviteInvitedUserIdUserIdFk: foreignKey({
			columns: [table.invitedUserId],
			foreignColumns: [user.id],
			name: "ListInvite_invitedUserId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		listInviteUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ListInvite_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
		listInvitePkey: primaryKey({ columns: [table.listId, table.invitedUserEmail], name: "ListInvite_pkey"}),
	}
});