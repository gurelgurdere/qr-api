/*
SQLyog Community v8.71 
MySQL - 5.1.54-community : Database - qr
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`qr` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_turkish_ci */;

USE `qr`;

/*Table structure for table `qrContent` */

DROP TABLE IF EXISTS `qrContent`;

CREATE TABLE `qrContent` (
  `contentId` int(11) NOT NULL AUTO_INCREMENT,
  `contentLanguageId` int(11) DEFAULT NULL,
  `contentType` int(11) DEFAULT NULL,
  `contentValue` int(11) DEFAULT NULL,
  `content` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`contentId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrContentLanguage` */

DROP TABLE IF EXISTS `qrContentLanguage`;

CREATE TABLE `qrContentLanguage` (
  `contentLanguageId` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(2) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`contentLanguageId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrDepartment` */

DROP TABLE IF EXISTS `qrDepartment`;

CREATE TABLE `qrDepartment` (
  `departmentId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `descr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`departmentId`),
  KEY `FK_GPDEPART_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPDEPART_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrFirm` */

DROP TABLE IF EXISTS `qrFirm`;

CREATE TABLE `qrFirm` (
  `firmId` int(11) NOT NULL AUTO_INCREMENT,
  `firmGroupId` int(11) DEFAULT NULL,
  `descr` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `shortDescr` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `active` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`firmId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrFirmAppModel` */

DROP TABLE IF EXISTS `qrFirmAppModel`;

CREATE TABLE `qrFirmAppModel` (
  `firmAppModelId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `appModel` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`firmAppModelId`),
  KEY `FK_GPFIRMAP_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPFIRMAP_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrFirmGroup` */

DROP TABLE IF EXISTS `qrFirmGroup`;

CREATE TABLE `qrFirmGroup` (
  `firmGroupId` int(11) NOT NULL AUTO_INCREMENT,
  `descr` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `shortDescr` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `active` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`firmGroupId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrFirmLicenceRegistration` */

DROP TABLE IF EXISTS `qrFirmLicenceRegistration`;

CREATE TABLE `qrFirmLicenceRegistration` (
  `firmLicenceRegistrationId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `licenceRegistrationId` int(11) DEFAULT NULL,
  `active` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`firmLicenceRegistrationId`),
  KEY `FK_GPFIRMLI_REFERENCE_GPFIRM` (`firmId`),
  KEY `FK_GPFIRMLI_REFERENCE_GPLICENC` (`licenceRegistrationId`),
  CONSTRAINT `FK_GPFIRMLI_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`),
  CONSTRAINT `FK_GPFIRMLI_REFERENCE_GPLICENC` FOREIGN KEY (`licenceRegistrationId`) REFERENCES `qrlicenceregistration` (`licenceRegistrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrFirmUser` */

DROP TABLE IF EXISTS `qrFirmUser`;

CREATE TABLE `qrFirmUser` (
  `firmUserId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `userPositionId` int(11) DEFAULT NULL,
  `userTypeId` int(11) DEFAULT NULL,
  `userProfileId` int(11) DEFAULT NULL,
  `active` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`firmUserId`),
  KEY `FK_GPFIRMUS_REFERENCE_GPUSER` (`userId`),
  KEY `FK_GPFIRMUS_REFERENCE_GPDEPART` (`departmentId`),
  KEY `FK_GPFIRMUS_REFERENCE_GPUSERPO` (`userPositionId`),
  KEY `FK_GPFIRMUS_REFERENCE_GPUSERTY` (`userTypeId`),
  KEY `FK_GPFIRMUS_REFERENCE_GPUSERPR` (`userProfileId`),
  CONSTRAINT `FK_GPFIRMUS_REFERENCE_GPDEPART` FOREIGN KEY (`departmentId`) REFERENCES `qrdepartment` (`departmentId`),
  CONSTRAINT `FK_GPFIRMUS_REFERENCE_GPUSER` FOREIGN KEY (`userId`) REFERENCES `qruser` (`userId`),
  CONSTRAINT `FK_GPFIRMUS_REFERENCE_GPUSERPO` FOREIGN KEY (`userPositionId`) REFERENCES `qruserposition` (`userPositionId`),
  CONSTRAINT `FK_GPFIRMUS_REFERENCE_GPUSERPR` FOREIGN KEY (`userProfileId`) REFERENCES `qruserprofile` (`userProfileId`),
  CONSTRAINT `FK_GPFIRMUS_REFERENCE_GPUSERTY` FOREIGN KEY (`userTypeId`) REFERENCES `qrusertype` (`userTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrFirmVariable` */

DROP TABLE IF EXISTS `qrFirmVariable`;

CREATE TABLE `qrFirmVariable` (
  `firmVariableId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `variableName` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `value` varchar(512) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`firmVariableId`),
  KEY `FK_GPFIRMVA_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPFIRMVA_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrLicence` */

DROP TABLE IF EXISTS `qrLicence`;

CREATE TABLE `qrLicence` (
  `licenceId` int(11) NOT NULL AUTO_INCREMENT,
  `licenceName` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`licenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrLicenceRegistration` */

DROP TABLE IF EXISTS `qrLicenceRegistration`;

CREATE TABLE `qrLicenceRegistration` (
  `licenceRegistrationId` int(11) NOT NULL AUTO_INCREMENT,
  `licenceId` int(11) DEFAULT NULL,
  `licenceKey` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `expireDate` datetime DEFAULT NULL,
  `ownerEmail` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`licenceRegistrationId`),
  UNIQUE KEY `UC_OWNEREMAIL_REG` (`ownerEmail`),
  KEY `FK_GPLICENC_REFERENCE_GPLICENC` (`licenceId`),
  CONSTRAINT `FK_GPLICENC_REFERENCE_GPLICENC` FOREIGN KEY (`licenceId`) REFERENCES `qrlicence` (`licenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrMenuGroup` */

DROP TABLE IF EXISTS `qrMenuGroup`;

CREATE TABLE `qrMenuGroup` (
  `menuGroupId` int(11) NOT NULL AUTO_INCREMENT,
  `parentMenuGroupId` int(11) DEFAULT NULL,
  `menuGroupCode` int(11) DEFAULT NULL,
  `iconDesktop` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `iconMobile` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  PRIMARY KEY (`menuGroupId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrMenuGroupName` */

DROP TABLE IF EXISTS `qrMenuGroupName`;

CREATE TABLE `qrMenuGroupName` (
  `menuGroupNameId` int(11) NOT NULL AUTO_INCREMENT,
  `menuGroupId` int(11) DEFAULT NULL,
  `contentLanguageId` int(11) DEFAULT NULL,
  `descr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`menuGroupNameId`),
  KEY `FK_GPMENUGR_REFERENCE_GPMENUGR` (`menuGroupId`),
  KEY `FK_GPMENUGR_REFERENCE_GPCONTEN` (`contentLanguageId`),
  CONSTRAINT `FK_GPMENUGR_REFERENCE_GPCONTEN` FOREIGN KEY (`contentLanguageId`) REFERENCES `qrcontentlanguage` (`contentLanguageId`),
  CONSTRAINT `FK_GPMENUGR_REFERENCE_GPMENUGR` FOREIGN KEY (`menuGroupId`) REFERENCES `qrmenugroup` (`menuGroupId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrMenuItem` */

DROP TABLE IF EXISTS `qrMenuItem`;

CREATE TABLE `qrMenuItem` (
  `menuItemId` int(11) NOT NULL AUTO_INCREMENT,
  `menuGroupId` int(11) DEFAULT NULL,
  `itemCode` int(11) DEFAULT NULL,
  `itemType` smallint(6) DEFAULT NULL,
  `itemUri` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `iconDesktop` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `iconMobile` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `active` int(11) DEFAULT NULL,
  PRIMARY KEY (`menuItemId`),
  KEY `FK_GPMENUIT_REFERENCE_GPMENUGR` (`menuGroupId`),
  CONSTRAINT `FK_GPMENUIT_REFERENCE_GPMENUGR` FOREIGN KEY (`menuGroupId`) REFERENCES `qrmenugroup` (`menuGroupId`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrMenuItemName` */

DROP TABLE IF EXISTS `qrMenuItemName`;

CREATE TABLE `qrMenuItemName` (
  `menuItemNameId` int(11) NOT NULL AUTO_INCREMENT,
  `menuItemId` int(11) DEFAULT NULL,
  `contentLanguageId` int(11) DEFAULT NULL,
  `descr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`menuItemNameId`),
  KEY `FK_GPMENUIT_REFERENCE_GPMENUIT` (`menuItemId`),
  KEY `FK_GPMENUIT_REFERENCE_GPCONTEN` (`contentLanguageId`),
  CONSTRAINT `FK_GPMENUIT_REFERENCE_GPCONTEN` FOREIGN KEY (`contentLanguageId`) REFERENCES `qrcontentlanguage` (`contentLanguageId`),
  CONSTRAINT `FK_GPMENUIT_REFERENCE_GPMENUIT` FOREIGN KEY (`menuItemId`) REFERENCES `qrmenuitem` (`menuItemId`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrMenuItemPermission` */

DROP TABLE IF EXISTS `qrMenuItemPermission`;

CREATE TABLE `qrMenuItemPermission` (
  `menuItemPermissionId` int(11) NOT NULL AUTO_INCREMENT,
  `menuItemId` int(11) DEFAULT NULL,
  `userProfileId` int(11) DEFAULT NULL,
  `permissionType` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`menuItemPermissionId`),
  KEY `FK_GPMENUIT_REFERENCE_GPMENUIT2` (`menuItemId`),
  KEY `FK_GPMENUIT_REFERENCE_GPUSERPR` (`userProfileId`),
  CONSTRAINT `FK_GPMENUIT_REFERENCE_GPMENUIT2` FOREIGN KEY (`menuItemId`) REFERENCES `qrmenuitem` (`menuItemId`),
  CONSTRAINT `FK_GPMENUIT_REFERENCE_GPUSERPR` FOREIGN KEY (`userProfileId`) REFERENCES `qruserprofile` (`userProfileId`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrPasswordChangeRequest` */

DROP TABLE IF EXISTS `qrPasswordChangeRequest`;

CREATE TABLE `qrPasswordChangeRequest` (
  `passwordChangeRequestId` int(11) NOT NULL AUTO_INCREMENT,
  `email` char(128) CHARACTER SET utf8 DEFAULT NULL,
  `authCode` varchar(10) CHARACTER SET utf8 DEFAULT NULL,
  `createdTime` datetime DEFAULT NULL,
  PRIMARY KEY (`passwordChangeRequestId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrServiceUsageLog` */

DROP TABLE IF EXISTS `qrServiceUsageLog`;

CREATE TABLE `qrServiceUsageLog` (
  `serviceUsageLogId` int(11) NOT NULL AUTO_INCREMENT,
  `serviceName` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  `serviceData` varchar(2048) CHARACTER SET utf8 DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `usageTime` datetime DEFAULT NULL,
  `resultMessage` varchar(512) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`serviceUsageLogId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUser` */

DROP TABLE IF EXISTS `qrUser`;

CREATE TABLE `qrUser` (
  `userId` int(11) NOT NULL AUTO_INCREMENT,
  `firmGroupId` int(11) DEFAULT NULL,
  `firstName` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `lastName` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `gender` smallint(6) DEFAULT NULL,
  `username` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `password` varchar(10) CHARACTER SET utf8 DEFAULT NULL,
  `email` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `imageUri` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `active` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`userId`),
  KEY `FK_GPUSER_REFERENCE_GPFIRMGR` (`firmGroupId`),
  CONSTRAINT `FK_GPUSER_REFERENCE_GPFIRMGR` FOREIGN KEY (`firmGroupId`) REFERENCES `qrfirmgroup` (`firmGroupId`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserAuthority` */

DROP TABLE IF EXISTS `qrUserAuthority`;

CREATE TABLE `qrUserAuthority` (
  `userAuthorityId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `descr` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `authorityLevel` int(11) DEFAULT NULL,
  PRIMARY KEY (`userAuthorityId`),
  KEY `FK_GPUSERAU_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPUSERAU_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserFavoriteItem` */

DROP TABLE IF EXISTS `qrUserFavoriteItem`;

CREATE TABLE `qrUserFavoriteItem` (
  `userFavoriteItemId` int(11) NOT NULL AUTO_INCREMENT,
  `firmUserId` int(11) DEFAULT NULL,
  `itemType` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `itemId` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`userFavoriteItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserHomeDashboard` */

DROP TABLE IF EXISTS `qrUserHomeDashboard`;

CREATE TABLE `qrUserHomeDashboard` (
  `userHomeDashboardId` int(11) NOT NULL AUTO_INCREMENT,
  `firmUserId` int(11) DEFAULT NULL,
  `dashboardId` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`userHomeDashboardId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserPosition` */

DROP TABLE IF EXISTS `qrUserPosition`;

CREATE TABLE `qrUserPosition` (
  `userPositionId` int(11) NOT NULL AUTO_INCREMENT,
  `userAuthorityId` int(11) DEFAULT NULL,
  `descr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  `parentPositionId` int(11) DEFAULT NULL,
  PRIMARY KEY (`userPositionId`),
  KEY `FK_GPUSERPO_REFERENCE_GPUSERAU` (`userAuthorityId`),
  CONSTRAINT `FK_GPUSERPO_REFERENCE_GPUSERAU` FOREIGN KEY (`userAuthorityId`) REFERENCES `qruserauthority` (`userAuthorityId`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserPositionMap` */

DROP TABLE IF EXISTS `qrUserPositionMap`;

CREATE TABLE `qrUserPositionMap` (
  `userPositionMapId` int(11) NOT NULL AUTO_INCREMENT,
  `parentPositionId` int(11) DEFAULT NULL,
  `childPositionId` int(11) DEFAULT NULL,
  PRIMARY KEY (`userPositionMapId`),
  KEY `FK_GPUSERPO_REFERENCE_GPUSERPO` (`parentPositionId`),
  KEY `FK_GPUSERPO_REFERENCE_GPUSERPO2` (`childPositionId`),
  CONSTRAINT `FK_GPUSERPO_REFERENCE_GPUSERPO` FOREIGN KEY (`parentPositionId`) REFERENCES `qruserposition` (`userPositionId`),
  CONSTRAINT `FK_GPUSERPO_REFERENCE_GPUSERPO2` FOREIGN KEY (`childPositionId`) REFERENCES `qruserposition` (`userPositionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserProfile` */

DROP TABLE IF EXISTS `qrUserProfile`;

CREATE TABLE `qrUserProfile` (
  `userProfileId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `descr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`userProfileId`),
  KEY `FK_GPUSERPR_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPUSERPR_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserType` */

DROP TABLE IF EXISTS `qrUserType`;

CREATE TABLE `qrUserType` (
  `userTypeId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `descr` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `code` int(11) DEFAULT NULL,
  PRIMARY KEY (`userTypeId`),
  KEY `FK_GPUSERTY_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPUSERTY_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserVariable` */

DROP TABLE IF EXISTS `qrUserVariable`;

CREATE TABLE `qrUserVariable` (
  `userVariableId` int(11) NOT NULL AUTO_INCREMENT,
  `firmId` int(11) DEFAULT NULL,
  `variableName` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`userVariableId`),
  KEY `FK_GPUSERVA_REFERENCE_GPFIRM` (`firmId`),
  CONSTRAINT `FK_GPUSERVA_REFERENCE_GPFIRM` FOREIGN KEY (`firmId`) REFERENCES `qrfirm` (`firmId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*Table structure for table `qrUserVariableValue` */

DROP TABLE IF EXISTS `qrUserVariableValue`;

CREATE TABLE `qrUserVariableValue` (
  `userVariableValueId` int(11) NOT NULL AUTO_INCREMENT,
  `userVariableId` int(11) DEFAULT NULL,
  `firmUserId` int(11) DEFAULT NULL,
  `variableValue` varchar(512) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`userVariableValueId`),
  KEY `FK_GPUSERVA_REFERENCE_GPUSERVA` (`userVariableId`),
  CONSTRAINT `FK_GPUSERVA_REFERENCE_GPUSERVA` FOREIGN KEY (`userVariableId`) REFERENCES `qruservariable` (`userVariableId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_turkish_ci;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
