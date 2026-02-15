<?php
// API V11.2 - PROFESSIONAL FULL (ML SYNC)
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. CONFIG
$ADMIN_SECRET = "Rein@ldo1912";
$fileLicenses = __DIR__ . '/api_data/database_licenses_secure.json';
$fileLogs = __DIR__ . '/api_data/system_logs.json';
$fileReceipts = __DIR__ . '/api_data/receipts_log.json';

// 2. CAPTURA DE DADOS
$action = $_GET['action'] ?? '';
$rawInput = file_get_contents("php://input");
$jsonData = json_decode($rawInput, true) ?? [];

if (empty($action) && isset($jsonData['action']))
    $action = $jsonData['action'];

// 3. HELPERS
function getDB($file)
{
    if (!file_exists($file))
        return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?? [];
}

function saveDB($file, $data)
{
    if (!is_dir(dirname($file)))
        mkdir(dirname($file), 0755, true);
    $fp = fopen($file, 'c+');
    if ($fp && flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
    return false;
}

function validateSecret($data, $secret)
{
    return (isset($data['secret']) && $data['secret'] === $secret);
}

function addLog($msg, $type = 'info', $file = '')
{
    global $fileLogs;
    $db = getDB($fileLogs);
    if (!isset($db['logs']))
        $db['logs'] = [];
    $db['logs'][] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $type,
        'msg' => $msg,
        'ip' => $_SERVER['REMOTE_ADDR']
    ];
    // Mantém apenas os últimos 500 logs
    if (count($db['logs']) > 500)
        array_shift($db['logs']);
    saveDB($fileLogs, $db);
}

// 4. ROTAS
if ($action === 'ping') {
    echo json_encode(['status' => 'success', 'msg' => 'V11.2 Full Online']);
    exit;
}

// --- ROTAS ADMINISTRATIVAS (EXIGEM SECRET) ---

if ($action === 'list' || $action === 'get_licenses') {
    if (!validateSecret($jsonData, $ADMIN_SECRET)) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Acesso Negado']);
        exit;
    }
    $db = getDB($fileLicenses);
    $response = [];
    foreach ($db as $k => $v) {
        $response[] = array_merge(['key' => $k], $v);
    }
    echo json_encode($response);
    exit;
}

if ($action === 'dashboard_stats') {
    if (!validateSecret($jsonData, $ADMIN_SECRET)) {
        http_response_code(403);
        exit;
    }
    $db = getDB($fileLicenses);
    $stats = [
        'total' => count($db),
        'active' => 0,
        'pending' => 0,
        'top_products' => []
    ];
    foreach ($db as $l) {
        if (($l['status'] ?? '') === 'active')
            $stats['active']++;
        else
            $stats['pending']++;

        $pName = $l['product'] ?? 'Desconhecido';
        if (!isset($stats['top_products'][$pName]))
            $stats['top_products'][$pName] = 0;
        $stats['top_products'][$pName]++;
    }
    echo json_encode($stats);
    exit;
}

if ($action === 'generate') {
    if (!validateSecret($jsonData, $ADMIN_SECRET)) {
        http_response_code(403);
        exit;
    }
    $db = getDB($fileLicenses);
    $qty = (int) ($jsonData['quantity'] ?? 1);
    $keys = [];

    for ($i = 0; $i < $qty; $i++) {
        // Formato XXXX-XXXX-XXXX
        $k = strtoupper(substr(md5(uniqid()), 0, 4) . '-' . substr(md5(uniqid()), 4, 4) . '-' . substr(md5(uniqid()), 8, 4));
        $db[$k] = [
            'client' => $jsonData['client'] ?? 'Mercado Livre',
            'product' => $jsonData['product'] ?? 'Sistema',
            'price' => (float) ($jsonData['price'] ?? 0),
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
            'type' => 'venda_ml'
        ];
        $keys[] = $k;
    }

    saveDB($fileLicenses, $db);
    addLog("Geradas $qty chaves para " . ($jsonData['client'] ?? 'Cliente'), 'info');
    echo json_encode(['status' => 'success', 'keys' => $keys]);
    exit;
}

if ($action === 'update_status') {
    if (!validateSecret($jsonData, $ADMIN_SECRET)) {
        http_response_code(403);
        exit;
    }
    $key = $jsonData['key'] ?? '';
    $status = $jsonData['status'] ?? '';
    $db = getDB($fileLicenses);

    if (isset($db[$key])) {
        if ($status === 'reset_device') {
            $db[$key]['device_id'] = '';
            $db[$key]['status'] = 'pending';
            addLog("Dispositivo resetado para chave $key", 'warning');
        } else {
            $db[$key]['status'] = $status;
        }
        saveDB($fileLicenses, $db);
        echo json_encode(['status' => 'success', 'success' => true]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Chave não encontrada']);
    }
    exit;
}

if ($action === 'get_receipts') {
    if (!validateSecret($jsonData, $ADMIN_SECRET)) {
        http_response_code(403);
        exit;
    }
    $db = getDB($fileReceipts);
    echo json_encode($db);
    exit;
}

if ($action === 'read_logs') {
    if (!validateSecret($jsonData, $ADMIN_SECRET)) {
        http_response_code(403);
        exit;
    }
    echo file_get_contents($fileLogs) ?: '{"logs":[]}';
    exit;
}

// --- ROTAS PUBLICAS (APP) ---

if ($action === 'activate') {
    $key = $jsonData['license_key'] ?? '';
    $device = $jsonData['device_id'] ?? 'legacy_' . time();
    if (empty($key)) {
        echo json_encode(['status' => 'error', 'message' => 'Chave vazia']);
        exit;
    }

    $db = getDB($fileLicenses);

    if (isset($db[$key])) {
        if (
            $db[$key]['status'] === 'active' &&
            !empty($db[$key]['device_id']) &&
            $db[$key]['device_id'] !== $device
        ) {
            echo json_encode(['status' => 'error', 'message' => 'Licença já usada em outro aparelho.']);
            exit;
        }

        $db[$key]['status'] = 'active';
        $db[$key]['device_id'] = $device;
        $db[$key]['activated_at'] = date('Y-m-d H:i:s');
        $db[$key]['last_ip'] = $_SERVER['REMOTE_ADDR'];

        saveDB($fileLicenses, $db);
        addLog("Sucesso: Chave $key ativada no device $device", 'info');
        echo json_encode(['status' => 'success', 'valid' => true, 'client' => $db[$key]['client']]);
    } else {
        addLog("Falha: Tentativa de ativação com chave inválida $key", 'error');
        echo json_encode(['status' => 'error', 'message' => 'Licença não encontrada']);
    }
    exit;
}

if ($action === 'confirm_receipt') {
    $key = $jsonData['license_key'] ?? '';
    $data = getDB($fileLicenses);

    $receipts = getDB($fileReceipts);
    $receipts[] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'license_key' => $key,
        'client_email' => $data[$key]['client'] ?? 'N/A',
        'confirmation_text' => 'Confirmo o recebimento do produto digital e o funcionamento do mesmo.'
    ];
    saveDB($fileReceipts, $receipts);
    addLog("Recibo confirmado para chave $key", 'info');
    echo json_encode(['status' => 'success']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Ação não definida ou inválida (V11.2)']);
?>