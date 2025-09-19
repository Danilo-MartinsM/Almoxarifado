/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: estoque
-- ------------------------------------------------------
-- Server version	11.7.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `movimentacoes`
--

DROP TABLE IF EXISTS `movimentacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('Entrada','Saída','Cadastro') NOT NULL,
  `quantidade` int(11) NOT NULL,
  `data_alteracao` datetime DEFAULT current_timestamp(),
  `id_produto` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `movimentacoes_ibfk_1` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentacoes`
--

LOCK TABLES `movimentacoes` WRITE;
/*!40000 ALTER TABLE `movimentacoes` DISABLE KEYS */;
INSERT INTO `movimentacoes` VALUES
(1,'Entrada',36,'2025-09-18 20:41:00',4),
(5,'Saída',20,'2025-09-18 20:42:00',2),
(6,'Entrada',300,'2025-09-18 20:42:00',8),
(7,'Entrada',40,'2025-09-09 22:08:00',6),
(8,'Saída',50,'2025-09-10 22:08:00',7),
(10,'Entrada',4,'2025-09-19 08:50:00',6),
(11,'Entrada',0,'2025-09-19 09:10:05',38),
(12,'Saída',7,'2025-09-19 09:12:00',4),
(13,'Entrada',50,'2025-09-19 09:15:00',2),
(14,'Entrada',12,'2025-09-19 09:27:00',4),
(15,'Saída',4,'2025-09-19 09:27:00',6),
(16,'Entrada',50,'2025-09-19 12:27:00',16),
(17,'Saída',5,'2025-09-19 14:28:00',4),
(18,'Saída',20,'2025-09-19 09:28:00',7),
(19,'Entrada',1,'2025-09-19 09:46:00',6),
(23,'Entrada',0,'2025-09-19 10:04:04',39),
(24,'Entrada',0,'2025-09-19 10:06:58',40),
(25,'Cadastro',0,'2025-09-19 10:39:18',41),
(26,'Entrada',10,'2025-09-19 10:50:00',9),
(27,'Entrada',20,'2025-09-19 10:51:00',10),
(28,'Entrada',500,'2025-09-19 10:51:00',11),
(29,'Entrada',100,'2025-09-19 10:51:00',12),
(30,'Cadastro',0,'2025-09-19 10:52:02',42),
(31,'Cadastro',0,'2025-09-19 14:32:59',43),
(32,'Entrada',5,'2025-09-19 14:34:00',43),
(33,'Saída',3,'2025-09-19 14:35:00',43),
(34,'Cadastro',0,'2025-09-19 14:48:37',44);
/*!40000 ALTER TABLE `movimentacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `categoria` enum('Insumos','Vasos','Caixas','Porta Vaso','Fita Cetim','Liga Elástica','Etiquetas') DEFAULT NULL,
  `quantidade` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES
(2,'SUBSTRATO','Insumos',740),
(4,'VASO VB','Vasos',97),
(6,'VASO P20','Vasos',101),
(7,'VASO P21 - EXP','Vasos',100),
(8,'VASO P06','Vasos',1300),
(9,'FITA CETIM VERDE','Fita Cetim',10),
(10,'VASO P14 - EXP','Vasos',820),
(11,'VASO P17','Vasos',1100),
(12,'FITA CETIM VERMELHA','Fita Cetim',140),
(16,'PORTA VASO P06','Vasos',50),
(38,'FFFFFFF','Vasos',0),
(39,'FFFFFFFFFFF','Vasos',0),
(40,'AAAAAAA','Caixas',0),
(41,'ADSDSD','Vasos',0),
(42,'ED','Liga Elástica',0),
(43,'CANETA AZUL','Insumos',2),
(44,'AAAA','Vasos',0);
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,'Danilo','$2b$12$3gZyM7LeGcM8grTPv33M7ejrsp/ZUs357d1VBp8qSwbMWilYwIVhC'),
(2,'Ana','$2b$12$bNS/NJmUu4jxU88fdahOfOVRjCzjqyLrllWsz/bUTur6txaGRghaG');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'estoque'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-09-19 15:01:24
