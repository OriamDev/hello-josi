-- -------------------------------------------------------------
-- TablePlus 5.6.6(520)
--
-- https://tableplus.com/
--
-- Database: josi
-- Generation Time: 2023-12-08 15:23:34.4030
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
  `password_cliente` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

DROP TABLE IF EXISTS `funcionario_projetos`;
CREATE TABLE `funcionario_projetos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_funcionario` bigint unsigned NOT NULL,
  `id_projeto` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `funcionario_projetos_id_projeto_foreign` (`id_projeto`),
  KEY `funcionario_projetos_id_funcionario_foreign` (`id_funcionario`),
  CONSTRAINT `funcionario_projetos_id_funcionario_foreign` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionarios` (`id_funcionario`),
  CONSTRAINT `funcionario_projetos_id_projeto_foreign` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

DROP TABLE IF EXISTS `funcionarios`;
CREATE TABLE `funcionarios` (
  `id_funcionario` bigint unsigned NOT NULL AUTO_INCREMENT,
  `data_nascimento_funcionario` date NOT NULL,
  `salario_funcionario` decimal(8,2) NOT NULL,
  `regime_funcionario` text NOT NULL,
  `nome_funcionario` text NOT NULL,
  `email_funcionario` text NOT NULL,
  `palavra_passe_funcionario` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `servico_funcionario` text NOT NULL,
  PRIMARY KEY (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

DROP TABLE IF EXISTS `pedido_produto`;
CREATE TABLE `pedido_produto` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_pedido` bigint unsigned NOT NULL,
  `id_produto` bigint unsigned NOT NULL,
  `cantidade_produto` int NOT NULL,
  `preco_produto` double(8,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_produto_id_produto_foreign` (`id_produto`),
  KEY `pedido_produto_id_pedido_foreign` (`id_pedido`),
  CONSTRAINT `pedido_produto_id_pedido_foreign` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `pedido_produto_id_produto_foreign` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;

DROP TABLE IF EXISTS `servicos`;
CREATE TABLE `servicos` (
  `id_servico` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome_servico` text NOT NULL,
  `descricao_servico` text NOT NULL,
  `imagem_servicio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `titulo_servico` text,
  PRIMARY KEY (`id_servico`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;;



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;