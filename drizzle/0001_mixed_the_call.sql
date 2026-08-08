CREATE TABLE `agentRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` varchar(100) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`trigger` enum('scheduled','manual','event') NOT NULL,
	`eventType` varchar(100),
	`productsGenerated` int DEFAULT 0,
	`productsRemoved` int DEFAULT 0,
	`pricingUpdates` int DEFAULT 0,
	`prompt` longtext,
	`result` longtext,
	`error` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentRuns_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentRuns_runId_unique` UNIQUE(`runId`)
);
--> statement-breakpoint
CREATE TABLE `analyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalRevenue` decimal(10,2) DEFAULT 0,
	`netRevenue` decimal(10,2) DEFAULT 0,
	`ordersCount` int DEFAULT 0,
	`conversionRate` decimal(5,2) DEFAULT 0,
	`topProductId` int,
	`topProductSales` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cryptoInvoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(100) NOT NULL,
	`orderId` int NOT NULL,
	`currency` enum('USDC','USDT') NOT NULL,
	`amount` decimal(18,6) NOT NULL,
	`walletAddress` varchar(255) NOT NULL,
	`status` enum('pending','confirmed','expired') NOT NULL DEFAULT 'pending',
	`transactionHash` varchar(255),
	`expiresAt` timestamp,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cryptoInvoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `cryptoInvoices_invoiceId_unique` UNIQUE(`invoiceId`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` varchar(100) NOT NULL,
	`subscriberId` int NOT NULL,
	`type` enum('welcome','followup_day1','followup_day3','followup_day7','followup_day14','repeat_purchase') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('sent','opened','clicked','bounced') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailCampaigns_campaignId_unique` UNIQUE(`campaignId`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`productIds` json NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('stripe','crypto') NOT NULL,
	`paymentStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`cryptoTransactionId` varchar(255),
	`stripeFee` decimal(10,2) DEFAULT 0,
	`netRevenue` decimal(10,2) DEFAULT 0,
	`downloadLinks` json,
	`downloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`fileUrl` text,
	`fileKey` text,
	`previewUrl` text,
	`thumbnail` text,
	`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
	`inventory` int DEFAULT 999,
	`soldCount` int DEFAULT 0,
	`rating` decimal(3,2) DEFAULT 0,
	`reviewCount` int DEFAULT 0,
	`isUpsell` boolean DEFAULT false,
	`upsellFor` int,
	`generatedBy` varchar(100),
	`agentRunId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
	`lastPurchaseAt` timestamp,
	`purchaseCount` int DEFAULT 0,
	`totalSpent` decimal(10,2) DEFAULT 0,
	`sequenceStep` int DEFAULT 0,
	`sequenceLastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320),
	`rating` int NOT NULL,
	`text` text NOT NULL,
	`productId` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
