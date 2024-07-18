-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: todolistdb
-- Erstellungszeit: 16. Jul 2024 um 20:36
-- Server-Version: 11.4.2-MariaDB-ubu2404
-- PHP-Version: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `ToDoListDatabase`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Daten für Tabelle `category`
--

INSERT INTO `category` (`category_id`, `category_name`) VALUES
(1, 'Kitchen'),
(2, 'Garden');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `todo`
--

CREATE TABLE `todo` (
  `todo_id` int(11) NOT NULL,
  `todo_title` varchar(30) NOT NULL,
  `todo_description` varchar(200) NOT NULL,
  `todo_due_date` date NOT NULL,
  `todo_finished` tinyint(1) NOT NULL DEFAULT 0,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Daten für Tabelle `todo`
--

INSERT INTO `todo` (`todo_id`, `todo_title`, `todo_description`, `todo_due_date`, `todo_finished`, `category_id`) VALUES
(2, 'Clean the fridge', 'Remove all food items, wipe down shelves and drawers, and discard expired products.', '2024-07-31', 0, 1),
(3, 'Descale dishwasher', 'Run an empty cycle with a descaling agent to remove limescale and improve efficiency.', '2024-07-19', 0, 1),
(4, 'Sanitize trash can', 'Empty the trash can, thoroughly clean it, and sanitize both the inside and outside to eliminate odors.', '2024-07-20', 0, 1),
(5, 'Mow the lawn', 'Mow the grass, remove clippings, and ensure an even cut height for a neat appearance.', '2024-07-17', 0, 2),
(6, 'Water the flowers', 'Water the flowers in the morning or evening to minimize evaporation and ensure they get enough moisture.', '2024-07-20', 0, 2),
(7, 'Clean garden furniture', 'Wipe down garden furniture, remove dirt and cobwebs, and make sure they are ready for use.', '2024-07-27', 1, 2);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indizes für die Tabelle `todo`
--
ALTER TABLE `todo`
  ADD PRIMARY KEY (`todo_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT für Tabelle `todo`
--
ALTER TABLE `todo`
  MODIFY `todo_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
