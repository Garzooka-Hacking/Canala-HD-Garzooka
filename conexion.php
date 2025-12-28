<?php
// conexion.php
$host = "localhost";        // Generalmente es localhost
$dbname = "mseet_40616715_garzooa25";  // El nombre de tu base de datos
$username = "mseet_40616715";   // El usuario que creaste en el hosting
$password = "HiZbCfUFGdg9";  // La contraseña del usuario del hosting

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}
?>