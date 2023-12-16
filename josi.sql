-- -------------------------------------------------------------
-- TablePlus 5.6.8(522)
--
-- https://tableplus.com/
--
-- Database: josi
-- Generation Time: 2023-12-16 21:01:06.5400
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id_cliente` bigint unsigned NOT NULL AUTO_INCREMENT,
  `telefone_cliente` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `morada_cliente` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `cidade_cliente` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `pais_cliente` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `nome_cliente` text NOT NULL,
  `email_cliente` text NOT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `funcionario_projetos`;
CREATE TABLE `funcionario_projetos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_funcionario` bigint unsigned NOT NULL,
  `id_projeto` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_funcionario` (`id_funcionario`),
  KEY `id_projeto` (`id_projeto`),
  CONSTRAINT `funcionario_projetos_ibfk_1` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionarios` (`id_funcionario`) ON DELETE CASCADE,
  CONSTRAINT `funcionario_projetos_ibfk_2` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `funcionarios`;
CREATE TABLE `funcionarios` (
  `id_funcionario` bigint unsigned NOT NULL AUTO_INCREMENT,
  `data_nascimento_funcionario` date NOT NULL,
  `salario_funcionario` decimal(8,2) NOT NULL,
  `regime_funcionario` text NOT NULL,
  `nome_funcionario` text NOT NULL,
  `email_funcionario` text NOT NULL,
  `servico_funcionario` text NOT NULL,
  PRIMARY KEY (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pedido_produto`;
CREATE TABLE `pedido_produto` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_pedido` bigint unsigned NOT NULL,
  `id_produto` bigint unsigned NOT NULL,
  `cantidade_produto` int NOT NULL,
  `preco_produto` double(8,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `pedido_produto_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `pedido_produto_ibfk_2` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id_pedido` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` bigint unsigned NOT NULL,
  `data_pedido` date NOT NULL,
  `hora_pedido` time NOT NULL,
  `metodo_pagamento` text NOT NULL,
  `subtotal_pedidos` double(8,2) NOT NULL,
  `imposto_pedidos` double(8,2) NOT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `pedidos_cliente_id_foreign` (`cliente_id`),
  CONSTRAINT `pedidos_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `produtos`;
CREATE TABLE `produtos` (
  `id_produto` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome_produto` text NOT NULL,
  `categoria_produto` text NOT NULL,
  `preco_produto` double(8,2) NOT NULL,
  `estado_produto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `desconto_produto` double(8,2) DEFAULT NULL,
  `imagem_produto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `projetos`;
CREATE TABLE `projetos` (
  `id_projeto` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_cliente` bigint unsigned NOT NULL,
  `preco_projeto` decimal(8,2) DEFAULT NULL,
  `nome_projeto` text NOT NULL,
  `data_inicio_projeto` date NOT NULL,
  `data_fim_projeto` date DEFAULT NULL,
  `estado_projeto` text NOT NULL,
  `servico_projeto` text,
  PRIMARY KEY (`id_projeto`),
  KEY `projetos_id_cliente_index` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `utilizadores`;
CREATE TABLE `utilizadores` (
  `nome_utilizador` text NOT NULL,
  `email_utilizador` text NOT NULL,
  `palavra_passe_utilizador` text NOT NULL,
  `id_utilizador` bigint NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id_utilizador`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;