import {
	pgTable,
	pgEnum,
	varchar,
	timestamp,
	text,
	integer,
	uniqueIndex,
	foreignKey,
	serial,
	boolean,
	doublePrecision,
	primaryKey,
	uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const itemType = pgEnum("ItemType", ["FLIGHT", "PLACE"]);
export const tokenType = pgEnum("TokenType", ["EMAIL", "API"]);

export const VerificationToken = pgTable(
	"VerificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", { precision: 3, mode: "string" }).notNull(),
	},
	(table) => {
		return {
			identifierTokenKey: uniqueIndex(
				"VerificationToken_identifier_token_key",
			).using("btree", table.identifier, table.token),
			tokenKey: uniqueIndex("VerificationToken_token_key").using(
				"btree",
				table.token,
			),
		};
	},
);

export const Token = pgTable(
	"Token",
	{
		id: serial("id").primaryKey().notNull(),
		createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updatedAt", {
			precision: 3,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		type: tokenType("type").notNull(),
		emailToken: text("emailToken"),
		valid: boolean("valid").default(true).notNull(),
		expiration: timestamp("expiration", {
			precision: 3,
			mode: "string",
		}).notNull(),
		userId: uuid("userId")
			.notNull()
			.references(() => User.id, { onDelete: "restrict", onUpdate: "cascade" }),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
	},
	(table) => {
		return {
			accessTokenKey: uniqueIndex("Token_accessToken_key").using(
				"btree",
				table.accessToken,
			),
			emailTokenKey: uniqueIndex("Token_emailToken_key").using(
				"btree",
				table.emailToken,
			),
			refreshTokenKey: uniqueIndex("Token_refreshToken_key").using(
				"btree",
				table.refreshToken,
			),
		};
	},
);

export const User = pgTable(
	"User",
	{
		id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
		email: text("email").notNull(),
		name: text("name"),
		isAdmin: boolean("isAdmin").default(false).notNull(),
		createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updatedAt", {
			precision: 3,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		emailVerified: timestamp("emailVerified", { precision: 3, mode: "string" }),
		image: text("image"),
	},
	(table) => {
		return {
			emailKey: uniqueIndex("User_email_key").using("btree", table.email),
		};
	},
);

export const Account = pgTable(
	"Account",
	{
		id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
		userId: uuid("userId")
			.notNull()
			.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
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
			providerProviderAccountIdKey: uniqueIndex(
				"Account_provider_providerAccountId_key",
			).using("btree", table.provider, table.providerAccountId),
		};
	},
);

export const Session = pgTable(
	"Session",
	{
		id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
		sessionToken: text("sessionToken").notNull(),
		userId: uuid("userId")
			.notNull()
			.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
		expires: timestamp("expires", { precision: 3, mode: "string" }).notNull(),
	},
	(table) => {
		return {
			sessionTokenKey: uniqueIndex("Session_sessionToken_key").using(
				"btree",
				table.sessionToken,
			),
		};
	},
);

export const Idea = pgTable("Idea", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	description: text("description").notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
});

export const Bookmark = pgTable("Bookmark", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
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
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
});

export const Flight = pgTable("Flight", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	flightNumber: text("flightNumber").notNull(),
	departureAirport: text("departureAirport").notNull(),
	departureDate: timestamp("departureDate", { mode: "string" }).notNull(),
	arrivalDate: timestamp("arrivalDate", { mode: "string" }).notNull(),
	arrivalAirport: text("arrivalAirport").notNull(),
	airline: text("airline").notNull(),
	reservationNumber: text("reservationNumber").notNull(),
	url: text("url").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	listId: uuid("listId").references(() => List.id, {
		onDelete: "set null",
		onUpdate: "cascade",
	}),
});

export const List = pgTable("List", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	name: text("name").notNull(),
	description: text("description"),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
});

export const Place = pgTable("Place", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	name: text("name").notNull(),
	description: text("description"),
	address: text("address"),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	itemId: uuid("itemId").references(() => Item.id, {
		onDelete: "cascade",
		onUpdate: "cascade",
	}),
	googleMapsId: text("googleMapsId"),
	types: text("types").array(),
	imageUrl: text("imageUrl"),
	phoneNumber: text("phoneNumber"),
	rating: doublePrecision("rating"),
	websiteUri: text("websiteUri"),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
});

export const Item = pgTable(
	"Item",
	{
		id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
		type: text("type").notNull(),
		createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updatedAt", {
			precision: 3,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		itemId: uuid("itemId").notNull(),
		listId: uuid("listId")
			.notNull()
			.references(() => List.id, { onDelete: "restrict", onUpdate: "cascade" }),
		userId: uuid("userId").references(() => User.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		itemType: itemType("itemType").default("PLACE").notNull(),
	},
	(table) => {
		return {
			listIdItemIdKey: uniqueIndex("Item_listId_itemId_key").using(
				"btree",
				table.listId,
				table.itemId,
			),
		};
	},
);

export const Movie = pgTable("Movie", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	title: text("title").notNull(),
	description: text("description").notNull(),
	image: text("image").notNull(),
	director: text("director"),
	userId: uuid("userId").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
});

export const MovieViewings = pgTable("MovieViewings", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	movieId: uuid("movieId")
		.notNull()
		.references(() => Movie.id, { onDelete: "cascade", onUpdate: "cascade" }),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
});

export const UserLists = pgTable(
	"UserLists",
	{
		createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updatedAt", {
			precision: 3,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		listId: uuid("listId")
			.notNull()
			.references(() => List.id, { onDelete: "cascade", onUpdate: "cascade" }),
		userId: uuid("userId")
			.notNull()
			.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => {
		return {
			userListsPkey: primaryKey({
				columns: [table.listId, table.userId],
				name: "UserLists_pkey",
			}),
		};
	},
);

export const ListInvite = pgTable(
	"ListInvite",
	{
		accepted: boolean("accepted").default(false).notNull(),
		listId: uuid("listId")
			.notNull()
			.references(() => List.id, { onDelete: "cascade", onUpdate: "cascade" }),
		invitedUserEmail: text("invitedUserEmail").notNull(),
		invitedUserId: uuid("invitedUserId").references(() => User.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		userId: uuid("userId")
			.notNull()
			.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => {
		return {
			listInvitePkey: primaryKey({
				columns: [table.listId, table.invitedUserEmail],
				name: "ListInvite_pkey",
			}),
		};
	},
);

export const Chat = pgTable("Chat", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	title: text("title").notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", {
		precision: 3,
		mode: "string",
	})
		.defaultNow()
		.notNull(),
});

export const ChatMessage = pgTable("ChatMessage", {
	id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
	chatId: uuid("chatId")
		.notNull()
		.references(() => Chat.id, { onDelete: "cascade", onUpdate: "cascade" }),
	userId: uuid("userId")
		.notNull()
		.references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
	role: text("role").notNull(),
	content: text("content").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", {
		precision: 3,
		mode: "string",
	})
		.defaultNow()
		.notNull(),
});
