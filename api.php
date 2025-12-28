<?php
// api.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Agregado OPTIONS
header("Access-Control-Allow-Headers: Content-Type");

// 1. MANEJO DE CORS (IMPORTANTE)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'conexion.php';

$action = $_GET['action'] ?? '';

// LEER DATOS (JSON)
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($action == 'login') {
        if (!isset($input['username']) || !isset($input['password'])) {
            echo json_encode(["success" => false, "message" => "Faltan datos"]);
            exit();
        }

        $u = $input['username'];
        $p = $input['password'];
        
        // Buscamos usuario
        $stmt = $conn->prepare("SELECT * FROM usuarios WHERE dni_socio = ? AND password = ?");
        $stmt->execute([$u, $p]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // SEGURIDAD: No devolver la contraseña al frontend
            unset($user['password']); 
            echo json_encode(["success" => true, "user" => $user]);
        } else {
            echo json_encode(["success" => false, "message" => "Credenciales incorrectas"]);
        }

    } elseif ($action == 'read_all') {
        // SEGURIDAD: No seleccionar la columna password
        $stmt = $conn->query("SELECT id, socio, dni_socio, prioridad, benef_name, benef_dni, benef_dob, benef_age, dir, role FROM usuarios WHERE role != 'admin' ORDER BY socio ASC");
        $socios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($socios);

    } elseif ($action == 'create_or_update') {
        // Validar que input exista
        if (!$input) { throw new Exception("No hay datos para guardar"); }

        $id = $input['id'] ?? null;
        // Usar ?? '' evita error si falta un campo
        $socio = $input['socio'] ?? '';
        $dni = $input['dni_socio'] ?? '';
        $prio = $input['prioridad'] ?? '';
        $benName = $input['benef_name'] ?? '';
        $benDni = $input['benef_dni'] ?? '';
        $benDob = $input['benef_dob'] ?? '';
        $benAge = $input['benef_age'] ?? 0;
        $dir = $input['dir'] ?? '';
        
        if ($id) {
            $sql = "UPDATE usuarios SET socio=?, dni_socio=?, prioridad=?, benef_name=?, benef_dni=?, benef_dob=?, benef_age=?, dir=? WHERE id=?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$socio, $dni, $prio, $benName, $benDni, $benDob, $benAge, $dir, $id]);
            echo json_encode(["success" => true, "message" => "Actualizado"]);
        } else {
            $pass = "1234"; 
            $role = "user";
            $sql = "INSERT INTO usuarios (socio, dni_socio, prioridad, benef_name, benef_dni, benef_dob, benef_age, dir, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$socio, $dni, $prio, $benName, $benDni, $benDob, $benAge, $dir, $pass, $role]);
            echo json_encode(["success" => true, "message" => "Creado"]);
        }

    } elseif ($action == 'delete') {
        $id = $input['id'] ?? null;
        if($id){
            $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        }

    } elseif ($action == 'change_password') {
        $dni = $input['username'];
        $newPass = $input['new_password'];
        
        $stmt = $conn->prepare("UPDATE usuarios SET password = ? WHERE dni_socio = ?");
        $stmt->execute([$newPass, $dni]);
        echo json_encode(["success" => true]);
    }

} catch (Exception $e) {
    // Capturar errores de base de datos para que no rompan el JSON
    echo json_encode(["success" => false, "message" => "Error del servidor: " . $e->getMessage()]);
}
?>