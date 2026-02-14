<?php
/**
 * PLENA LICENSE SERVER V5.0 - NEXUS CRM INTEGRATED
 * Sistema completo de gestão de licenças, CRM, financeiro, produtos e equipe.
 */

// ==================================================================
// 0. CONFIGURAÇÃO DE AMBIENTE E CORS
// ==================================================================

// Inicia buffer de saída
ob_start();

// Desativa exibição de erros (para não quebrar JSON)
error_reporting(0);
ini_set('display_errors', 0);

// Define Timezone
date_default_timezone_set('America/Sao_Paulo');

// Headers de segurança e CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Secret");
header("Content-Type: application/json; charset=UTF-8");

// Tratamento de Preflight (CORS) - Retorno imediato
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Headers anti-cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// ==================================================================
// 1. CARREGAMENTO DE DEPENDÊNCIAS
// ==================================================================

// Carrega secrets se existir
if (file_exists(__DIR__ . '/secrets.php'))
    require_once __DIR__ . '/secrets.php';

// Configurações padrão
if (!isset($ADMIN_SECRET) || empty($ADMIN_SECRET)) {
    $ADMIN_SECRET = 'Rein@ldo1912';
}

// Constantes do sistema
define('SYSTEM_VERSION', '5.0.0');
define('SYSTEM_NAME', 'Plena Nexus CRM');

// ==================================================================
// 2. ARQUIVOS DE DADOS
// ==================================================================

$DATA_DIR = __DIR__ . '/api_data/';

// Diretório raiz é usado para dados
if (!file_exists($DATA_DIR)) {
    @mkdir($DATA_DIR, 0755, true);
}

// Arquivos principais
// Arquivos principais
$DB_FILE = $DATA_DIR . 'database_licenses_secure.json';
$LEADS_FILE = $DATA_DIR . 'leads_crm.json';
$PRODUCTS_FILE = $DATA_DIR . 'products_catalog.json';
$FINANCE_FILE = $DATA_DIR . 'finance_transactions.json'; // Remapped from finance.json
$RECEIPTS_FILE = $DATA_DIR . 'receipts_log.json'; // New File for Terms Acceptance
$PARTNERS_FILE = $DATA_DIR . 'parceiros.json';         // Remapped from partners.json
$TEAM_FILE = $DATA_DIR . 'team_members.json';
$REPORTS_FILE = $DATA_DIR . 'reports_history.json';
$LOGS_FILE = $DATA_DIR . 'system_logs.json';
$APPS_CONFIG_FILE = $DATA_DIR . 'apps_config.json';
$NOTIFICATIONS_FILE = $DATA_DIR . 'notifications_system.json'; // New File
$DEBUG_LOG = $DATA_DIR . 'debug_log.txt';

// Garante que os arquivos existam com estrutura inicial
$init_files = [
    $DB_FILE => [],
    $LEADS_FILE => [],
    $PRODUCTS_FILE => [],
    $FINANCE_FILE => [], // Inicializa array vazio
    $PARTNERS_FILE => [],
    $TEAM_FILE => [],
    $REPORTS_FILE => [],
    $LOGS_FILE => [],
    $APPS_CONFIG_FILE => [],
    $NOTIFICATIONS_FILE => [], // New Init
    $RECEIPTS_FILE => []
];

foreach ($init_files as $file => $default) {
    if (!file_exists($file)) {
        // Criação atômica básica
        @file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT), LOCK_EX);
        // Garante permissões (se possível)
        @chmod($file, 0666);
    }
}
if (!file_exists($DEBUG_LOG)) {
    @file_put_contents($DEBUG_LOG, "", LOCK_EX);
    @chmod($DEBUG_LOG, 0666);
}

// ==================================================================
// 3. CATÁLOGO DE PRODUTOS (MASTER)
// ==================================================================

$CATALOG_MASTER = [
    'Plena Aluguéis' => ['price' => 97.00, 'category' => 'aluguel', 'trial_days' => 7, 'status' => 'active'],
    'Plena Artesanato' => ['price' => 97.00, 'category' => 'outros', 'trial_days' => 7, 'status' => 'active'],
    'Plena Assistência' => ['price' => 97.00, 'category' => 'servicos', 'trial_days' => 7, 'status' => 'active'],
    'Plena Barbearia' => ['price' => 97.00, 'category' => 'beleza', 'trial_days' => 7, 'status' => 'active'],
    'Plena Beleza' => ['price' => 97.00, 'category' => 'beleza', 'trial_days' => 7, 'status' => 'active'],
    'Plena Card' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Checklist' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Controle' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Delivery' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Distribuidora' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Driver' => ['price' => 57.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Entregas' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Estoque' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Feirante' => ['price' => 97.00, 'category' => 'vendas', 'trial_days' => 7, 'status' => 'active'],
    'Plena Finanças' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Fit' => ['price' => 97.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active'],
    'Plena Frota' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Hamburgueria' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Marmita' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Motoboy' => ['price' => 57.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Motorista' => ['price' => 57.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Nutri' => ['price' => 97.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active'],
    'Plena Obras' => ['price' => 97.00, 'category' => 'servicos', 'trial_days' => 7, 'status' => 'active'],
    'Plena Odonto' => ['price' => 127.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active'],
    'Plena Orçamentos' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena PDV' => ['price' => 147.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Pizzaria' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Sorveteria' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Terapia' => ['price' => 97.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active']
];

// ==================================================================
// 4. FUNÇÕES UTILITÁRIAS
// ==================================================================

function addFinancialTransaction($type, $amount, $description, $category = 'other', $related_id = null)
{
    global $FINANCE_FILE;

    $transactions = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];

    // Ensure uniqueness
    $id = uniqid('fin_');

    $transaction = [
        'id' => $id,
        'date' => date('Y-m-d H:i:s'),
        'type' => $type, // 'income' or 'expense'
        'amount' => floatval($amount),
        'description' => $description,
        'category' => $category,
        'related_id' => $related_id
    ];

    // Add to beginning of array (newest first)
    array_unshift($transactions, $transaction);

    // Optional: Limit history size if needed, but for finance we usually keep all
    // if (count($transactions) > 5000) array_pop($transactions);

    @file_put_contents($FINANCE_FILE, json_encode($transactions, JSON_PRETTY_PRINT));
    return $transaction;
}

function checkAuth($data, $get, $server)
{
    global $ADMIN_SECRET;

    // DEV BYPASS: Allow localhost without password
    $host = $server['SERVER_NAME'] ?? '';
    if ($host === 'localhost' || $host === '127.0.0.1') {
        return true;
    }

    $auth = $server['HTTP_X_ADMIN_SECRET'] ?? $data['secret'] ?? $get['secret'] ?? '';
    return $auth === $ADMIN_SECRET;
}

function systemLog($message, $type = 'info')
{
    global $LOGS_FILE;
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $type,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];

    $content = @file_get_contents($LOGS_FILE);
    $logs = $content ? json_decode($content, true) : [];
    if (!is_array($logs))
        $logs = [];

    $logs[] = $logEntry;

    if (count($logs) > 5000) {
        $logs = array_slice($logs, -5000);
    }

    @file_put_contents($LOGS_FILE, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function jsonResponse($data, $status = 200)
{
    // Limpa qualquer lixo (espaços, warnings) antes do JSON
    ob_clean();

    http_response_code($status);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    if ($json === false) {
        // Fallback em caso de erro de encoding
        echo json_encode(['error' => 'JSON Encoding Error: ' . json_last_error_msg()]);
    } else {
        echo $json;
    }
    exit;
}

function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generateId($prefix = '')
{
    return uniqid($prefix) . '_' . substr(md5(microtime()), 0, 6);
}

// ==================================================================
// 5. PROCESSAMENTO DA REQUEST
// ==================================================================

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$json_input = file_get_contents('php://input');
if (empty($json_input) && php_sapi_name() === 'cli') {
    $json_input = file_get_contents('php://stdin');
}
$data = json_decode($json_input, true) ?? [];

// ==================================================================
// PATCH DE SEGURANÇA: Compatibilidade de Parâmetros
// ==================================================================
// Garante que o script entenda tanto 'device_id' (Legado) quanto 'device_fingerprint' (Novo Lock.js)
$device_input = $data['device_id'] ?? $data['device_fingerprint'] ?? '';

$server = $_SERVER;

// ==================================================================
// 6. ACTIONS PÚBLICAS (VALIDAÇÃO E ATIVAÇÃO DE LICENÇA)
// ==================================================================

if ($action === 'activate') {
    $key = $data['license_key'] ?? '';
    $email = $data['email'] ?? '';
    $device = $device_input;

    if (empty($key) || empty($email) || empty($device)) {
        jsonResponse(["status" => "error", "message" => "Chave, E-mail e Dispositivo são obrigatórios"], 400);
    }



    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];
    if (!is_array($db))
        $db = [];

    // Procura chave (Case Insensitive)
    $foundKey = null;
    foreach ($db as $k => $v) {
        if (strtoupper($k) === strtoupper($key)) {
            $foundKey = $k;
            break;
        }
    }

    if (!$foundKey) {
        jsonResponse(["status" => "error", "message" => "Licença não encontrada"], 404);
    }

    $license = $db[$foundKey];

    // Lógica de Bind Automático (Primeiro uso = Dono)
    if (empty($license['device_id'])) {
        $db[$foundKey]['device_id'] = $device;
        $db[$foundKey]['client'] = $email;
        $db[$foundKey]['activated_at'] = date('Y-m-d H:i:s');
        $db[$foundKey]['status'] = 'active';
        $db[$foundKey]['access_count'] = 1;

        @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

        systemLog("Licença $foundKey ativada via ML (Novo) por $email", 'info');

        jsonResponse([
            "status" => "success",
            "token" => base64_encode($foundKey . '|' . $device),
            "type" => $license['type'] ?? 'regular',
            "message" => "Sistema ativado com sucesso!",
            "redirect" => "./app.html"
        ]);
    } else {
        if ($license['device_id'] === $device && strtolower($license['client'] ?? '') === strtolower($email)) {
            jsonResponse([
                "status" => "success",
                "token" => base64_encode($foundKey . '|' . $device),
                "type" => $license['type'] ?? 'regular',
                "message" => "Bem-vindo de volta!",
                "redirect" => "./app.html"
            ]);
        } else {
            jsonResponse(["status" => "error", "message" => "Esta licença já está vinculada a outro dispositivo."], 403);
        }
    }
}

// ACTION: GENERATE (ADMIN ONLY)
if ($action === 'generate') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $product = $data['product'] ?? 'Plena Barbearia';
    $type = $data['type'] ?? 'vitalicio_ml';
    $qty = intval($data['quantity'] ?? 1);

    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];

    $generated = [];
    for ($i = 0; $i < $qty; $i++) {
        $newKey = strtoupper(substr(md5(uniqid(rand(), true)), 0, 12));
        $newKey = implode('-', str_split($newKey, 4)); // Format: XXXX-XXXX-XXXX

        $db[$newKey] = [
            'product' => $product,
            'type' => $type,
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
            'price' => floatval($data['price'] ?? 0),
            'client' => null,
            'device_id' => null
        ];
        $generated[] = $newKey;
    }

    @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    jsonResponse(['status' => 'success', 'keys' => $generated]);
}

// Helper para token simples (visto que btoa não existe nativo no PHP, usamos base64_encode)
function btoa($data)
{
    return base64_encode($data);
}

// ==================================================================
// ACTION: VALIDATE ACCESS (Chamada pelo Lock.js)
// ==================================================================
if ($action === 'validate_access' || $action === 'validate') {
    $key = $data['license_key'] ?? '';
    $app_id = $data['app_id'] ?? ''; 
    $device = $device_input; // Usa o parâmetro sanitizado

    if (empty($key)) {
        jsonResponse(["valid" => false, "message" => "Licença não informada"], 400);
    }

    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];

    // Busca Licença (Case Insensitive)
    if (!isset($db[$key])) {
        foreach ($db as $k => $v) {
            if (strtoupper($k) === strtoupper($key)) {
                $key = $k;
                break;
            }
        }
    }

    if (!isset($db[$key])) {
        jsonResponse(["valid" => false, "message" => "Licença inválida ou não encontrada no rede."], 404);
    }

    $license = $db[$key];

    // 1. Verifica Status Global
    if (($license['status'] ?? 'active') !== 'active') {
        jsonResponse(["valid" => false, "message" => "Licença inativa ou bloqueada."], 403);
    }

    // 2. Validação de Dispositivo (Airlock)
    // Se a licença já tem um dispositivo gravado, DEVE bater com o atual.
    $registeredDevice = $license['device_id'] ?? null;

    if (!empty($registeredDevice)) {
        if ($registeredDevice !== $device) {
            // KILL SWITCH ATIVADO
            systemLog("Bloqueio: Licença $key tentou acesso com ID $device (Esperado: $registeredDevice)", 'security');
            jsonResponse(["valid" => false, "message" => "Violação de Segurança: Esta licença pertence a outro dispositivo."], 403);
        }
    } else {
        // Se estiver vazio no servidor (primeiro acesso pós-reset), vincula agora (Auto-Bind).
        $db[$key]['device_id'] = $device;
        $db[$key]['last_access'] = date('Y-m-d H:i:s');
        @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    }

    // 3. Sucesso
    jsonResponse([
        "valid" => true,
        "message" => "Acesso Autorizado",
        "registered_device" => $device
    ]);
}

// ACTION: CONFIRM RECEIPT (DIGITAL SIGNATURE)
if ($action === 'confirm_receipt') {
    $key = $data['license_key'] ?? '';
    // $device = $data['device_id'] ?? ''; // Optional validation
    $text = $data['confirmation_text'] ?? '';

    if (empty($key) || empty($text)) {
        jsonResponse(["success" => false, "message" => "Chave e texto de confirmação obrigatórios"], 400);
    }

    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];

    // Validate License exists
    if (!isset($db[$key])) {
        // Try case insensitive find
        foreach ($db as $k => $v) {
            if (strtoupper($k) === strtoupper($key)) {
                $key = $k;
                break;
            }
        }
        if (!isset($db[$key])) {
            jsonResponse(["success" => false, "message" => "Licença inválida"], 404);
        }
    }

    // Append to Receipts Log
    $receipts_db = json_decode(@file_get_contents($RECEIPTS_FILE), true) ?? [];

    $receipt_entry = [
        'id' => uniqid('rec_'),
        'timestamp' => date('Y-m-d H:i:s'),
        'license_key' => $key,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'confirmation_text' => $text,
        'client_email' => $db[$key]['client'] ?? 'unknown'
    ];

    $receipts_db[] = $receipt_entry;
    @file_put_contents($RECEIPTS_FILE, json_encode($receipts_db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // Log System Event
    systemLog("Termos aceitos para licença $key (IP: {$receipt_entry['ip']})", 'legal');

    jsonResponse(['success' => true, 'message' => 'Aceite registrado com sucesso.']);
}

// ==================================================================
// 7. ACTIONS DO ADMINISTRADOR
// ==================================================================

// LIST
if ($action === 'list') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];
    if (!is_array($db))
        $db = [];

    $licenses = [];
    foreach ($db as $k => $l) {
        $l['key'] = $k;
        $licenses[] = $l;
    }
    usort($licenses, function ($a, $b) {
        return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
    });
    jsonResponse($licenses);
}

// DASHBOARD
if ($action === 'dashboard_stats') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $leads = json_decode(@file_get_contents($LEADS_FILE), true) ?? [];

    $total_revenue = 0;
    $clients_map = [];
    $product_counts = [];
    $subscriptions = [];
    $monthly_revenue = 0;
    $last_month_revenue = 0;
    $expiring_count = 0;
    $sales_by_date = [];
    $unique_devices = []; // Count unique active devices

    $current_month = date('Y-m');
    $last_month = date('Y-m', strtotime('first day of last month'));

    foreach ($db as $license) {
        $price = $license['price'] ?? 0;
        $created = substr($license['created_at'] ?? '', 0, 10);
        $created_month = substr($license['created_at'] ?? '', 0, 7);
        $status = $license['status'] ?? 'active';
        $expires = $license['expires_at'] ?? null;

        $total_revenue += $price;
        if ($created_month === $current_month)
            $monthly_revenue += $price;
        if ($created_month === $last_month)
            $last_month_revenue += $price;

        if ($status === 'active') {
            $subscriptions[] = $price;
            if (!empty($license['device_id'])) {
                $unique_devices[$license['device_id']] = 1;
            }
        }

        if ($status === 'active' && $expires && strtotime($expires) > time() && strtotime($expires) < strtotime('+7 days')) {
            $expiring_count++;
        }

        $email = $license['client'] ?? 'unknown';
        $clients_map[$email] = 1;

        $prod = $license['product'] ?? 'N/A';
        $product_counts[$prod] = ($product_counts[$prod] ?? 0) + 1;

        $sales_by_date[$created] = ($sales_by_date[$created] ?? 0) + 1;
    }

    // Dados para gráfico
    $chart_labels = [];
    $chart_data = [];
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $chart_labels[] = date('d/m', strtotime($date));
        $chart_data[] = $sales_by_date[$date] ?? 0;
    }

    $revenue_growth = 0;
    if ($last_month_revenue > 0)
        $revenue_growth = (($monthly_revenue - $last_month_revenue) / $last_month_revenue) * 100;
    elseif ($monthly_revenue > 0)
        $revenue_growth = 100;

    arsort($product_counts);
    $top_products = array_slice($product_counts, 0, 10, true);

    jsonResponse([
        'total_revenue' => $total_revenue,
        'monthly_revenue' => $monthly_revenue,
        'mrr' => array_sum($subscriptions),
        'total_clients' => count($clients_map),
        'active_subscriptions' => count($subscriptions),
        'active_devices_count' => count($unique_devices),
        'expiring_soon' => $expiring_count,
        'revenue_growth' => round($revenue_growth, 1),
        'top_products' => $top_products,
        'chart' => [
            'labels' => $chart_labels,
            'data' => $chart_data
        ]
    ]);
}

// SYSTEM DIAGNOSIS (UPDATED)
if ($action === 'system_diag' || $action === 'system_health') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $health = [
        'db' => false,
        'smtp' => false,
        'mp' => false,
        'details' => [], // Added details array
        'version' => SYSTEM_VERSION,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    // DB Check
    if (is_writable($DB_FILE)) {
        $health['db'] = true;
        $health['details'][] = "Database JSON is writable.";
    } else {
        $health['details'][] = "CRITICAL: Database ($DB_FILE) is NOT writable/found.";
    }

    // SMTP Check
    global $SMTP_HOST, $SMTP_USER;
    if (!empty($SMTP_HOST) && $SMTP_HOST !== 'localhost' && !empty($SMTP_USER)) {
        $health['smtp'] = true;
        $health['details'][] = "SMTP Config found: $SMTP_HOST ($SMTP_USER).";
    } else {
        $health['details'][] = "SMTP Config missing or default.";
    }

    // MP Check
    global $ACCESS_TOKEN;
    if (!empty($ACCESS_TOKEN) && strpos($ACCESS_TOKEN, 'APP_USR') === 0) {
        $health['mp'] = true;
        $health['details'][] = "Mercado Pago Token detected.";
    } else {
        $health['details'][] = "Mercado Pago Token missing or invalid.";
    }

    // Consolidated Details
    $health['details'] = implode(" | ", $health['details']);

    jsonResponse($health);
}

// TEST SMTP (NEW)
if ($action === 'test_smtp') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $email_to = $data['email_destino'] ?? '';
    if (empty($email_to))
        jsonResponse(['error' => 'Email de destino obrigatório'], 400);

    // Carrega Mailer
    if (file_exists('api_mailer.php'))
        require_once 'api_mailer.php';
    else
        jsonResponse(['error' => 'api_mailer.php not found'], 500);

    // Tenta usar a classe diretamente para pegar o log preciso
    global $SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS;

    if (!class_exists('SimpleMailer')) {
        jsonResponse(['error' => 'SimpleMailer Class Not Found'], 500);
    }

    $mailer = new SimpleMailer($SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS);
    // $mailer->setDebug(true); // Opcional, se sua classe suportar

    $subject = "Teste de Diagnóstico SMTP - Plena";
    $body = "<h1>Teste de SMTP Bem Sucedido!</h1><p>Se você está lendo isso, seu servidor de e-mail está configurado corretamente.</p><p>Timestamp: " . date('Y-m-d H:i:s') . "</p>";

    $sent = $mailer->send($email_to, $subject, $body, $SMTP_USER, "Plena Admin (Teste)");

    if ($sent) {
        jsonResponse([
            'success' => true,
            'message' => "250 OK - E-mail aceito pelo servidor.",
            'details' => $mailer->getLogs() // Se sua classe SimpleMailer tiver getLogs
        ]);
    } else {
        $error_logs = $mailer->getLogs();
        $err_msg = !empty($error_logs) ? implode('; ', $error_logs) : 'Erro desconhecido ao conectar/enviar.';
        jsonResponse([
            'success' => false,
            'error' => "Falha no envio: $err_msg",
        ], 500);
    }
}

// GET LEADS
if ($action === 'get_leads') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $leads = json_decode(@file_get_contents($LEADS_FILE), true) ?? [];
    if (!empty($leads) && array_keys($leads) !== range(0, count($leads) - 1))
        $leads = array_values($leads);
    jsonResponse($leads);
}

// SAVE LEAD
if ($action === 'save_lead') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $lead = $data['lead'] ?? [];
    $is_edit = $data['is_edit'] ?? false;

    $leads = json_decode(@file_get_contents($LEADS_FILE), true) ?? [];
    if (!empty($leads) && array_keys($leads) !== range(0, count($leads) - 1))
        $leads = array_values($leads);

    if ($is_edit) {
        foreach ($leads as &$l) {
            if ($l['id'] === $lead['id']) {
                $l = array_merge($l, $lead);
                break;
            }
        }
    } else {
        $lead['id'] = generateId('lead_');
        $lead['created_at'] = date('Y-m-d H:i:s');
        $lead['status'] = 'pending';
        $leads[] = $lead;
    }
    @file_put_contents($LEADS_FILE, json_encode($leads, JSON_PRETTY_PRINT));
    jsonResponse(['success' => true]);
}

// FINANCE
// FINANCE REPORT
if ($action === 'get_finance') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $finance_db = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];

    $incomes = 0;
    $expenses = 0;

    // NEXUS 2.0: Read ONLY from finance ledger (No more mix with DB_FILE)
    foreach ($finance_db as $t) {
        if ($t['type'] === 'income')
            $incomes += $t['amount'];
        else
            $expenses += $t['amount'];
    }

    jsonResponse([
        'incomes' => $incomes,
        'expenses' => $expenses,
        'balance' => $incomes - $expenses,
        'transactions' => array_slice($finance_db, 0, 100) // Return last 100 for efficiency
    ]);
}

// MIGRATION TOOL (ONE-OFF)
if ($action === 'migrate_legacy_sales') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $finance_db = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];

    $count = 0;
    $existing_refs = array_column($finance_db, 'related_id');

    foreach ($db as $key => $l) {
        $price = $l['price'] ?? 0;
        // If price > 0 and NOT already in finance ledgers (check related_id)
        if ($price > 0 && !in_array($key, $existing_refs)) {
            $date = $l['activated_at'] ?? $l['created_at'] ?? date('Y-m-d H:i:s');
            // Add manually to array to bulk save later
            $finance_db[] = [
                'id' => uniqid('fin_mig_'),
                'date' => $date,
                'type' => 'income',
                'amount' => floatval($price),
                'description' => "Venda (Legado): " . ($l['product'] ?? 'N/A'),
                'category' => 'migracao',
                'related_id' => $key
            ];
            $count++;
        }
    }

    // Sort by date desc
    usort($finance_db, function ($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });

    @file_put_contents($FINANCE_FILE, json_encode($finance_db, JSON_PRETTY_PRINT));
    jsonResponse(['success' => true, 'migrated' => $count]);
}

// PRODUCTS
if ($action === 'get_products') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    global $CATALOG_MASTER;
    $products = json_decode(@file_get_contents($PRODUCTS_FILE), true) ?? [];

    // If no products file, use Master Catalog as base
    if (empty($products)) {
        $products = [];
        foreach ($CATALOG_MASTER as $name => $details) {
            $products[] = array_merge(['id' => generateId('prod_'), 'name' => $name], $details);
        }
    }

    jsonResponse($products);
}

// CREATE APP (SCAFFOLDING)
if ($action === 'create_app') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $name = $data['name'] ?? '';
    $slug = $data['slug'] ?? '';
    $price = floatval($data['price'] ?? 0);
    $category = $data['category'] ?? 'plus';

    if (empty($name) || empty($slug))
        jsonResponse(['error' => 'Nome e Slug são obrigatórios'], 400);

    // 1. Sanitize Slug
    $slug = strtolower(preg_replace('/[^a-z0-9_]/', '', $slug));

    // 2. Scaffold Folder
    $app_dir = __DIR__ . '/apps.plus/' . $slug;
    if (!file_exists($app_dir)) {
        if (!mkdir($app_dir, 0755, true))
            jsonResponse(['error' => 'Falha ao criar diretório do App'], 500);

        // Create Index.html
        $html_content = "<!DOCTYPE html>
<html lang='pt-br'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>$name</title>
    <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>
</head>
<body class='bg-light'>
    <div class='container py-5 text-center'>
        <h1 class='display-4'>$name</h1>
        <p class='lead'>Aplicativo gerado pelo Plena Admin.</p>
        <hr class='my-4'>
        <p>Este é o ponto de partida do seu novo aplicativo.</p>
        <a href='#' class='btn btn-primary btn-lg'>Começar</a>
    </div>
</body>
</html>";
        file_put_contents($app_dir . '/index.html', $html_content);
    }

    // 3. Update Apps Config
    $CONFIG_FILE = $DATA_DIR . 'apps_config.json';
    $config = json_decode(@file_get_contents($CONFIG_FILE), true) ?? [];
    $config[$slug] = ['name' => $name, 'price' => $price, 'category' => $category];
    @file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT));

    // 4. Register in Products Catalog (for License binding)
    global $CATALOG_MASTER;
    $products = json_decode(@file_get_contents($PRODUCTS_FILE), true) ?? [];

    // If empty, initialize with Master first
    if (empty($products)) {
        foreach ($CATALOG_MASTER as $m_name => $m_details) {
            $products[] = array_merge(['id' => generateId('prod_'), 'name' => $m_name], $m_details);
        }
    }

    // Check if exists
    $exists = false;
    foreach ($products as $p) {
        if ($p['name'] === $name) {
            $exists = true;
            break;
        }
    }

    if (!$exists) {
        $products[] = [
            'id' => generateId('prod_'),
            'name' => $name,
            'price' => $price,
            'category' => $category,
            'status' => 'active',
            'trial_days' => 7
        ];
        @file_put_contents($PRODUCTS_FILE, json_encode($products, JSON_PRETTY_PRINT));
    }

    jsonResponse(['success' => true]);
}

// LOGS
if ($action === 'get_logs') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $logs = json_decode(@file_get_contents($LOGS_FILE), true) ?? [];
    $logs = array_reverse($logs);

    // Formata para string array simples pra compatibilidade
    $simple_logs = [];
    foreach ($logs as $l)
        $simple_logs[] = "[{$l['timestamp']}] [{$l['type']}] {$l['message']}";

    jsonResponse(['logs' => $simple_logs]);
}

// SALES HISTORY
if ($action === 'get_sales_history') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $sales = [];
    foreach ($db as $key => $l) {
        $sales[] = [
            'id' => $l['payment_id'] ?? 'MANUAL',
            'date' => $l['created_at'] ?? '',
            'client' => $l['client'] ?? '',
            'product' => $l['product'] ?? '',
            'amount' => $l['price'] ?? 0,
            'status' => 'paid',
            'payment_method' => 'mercadopago',
            'license_key' => $key
        ];
    }
    jsonResponse($sales);
}

// MANUAL CREATE
if ($action === 'create') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $client = $data['client_name'] ?? '';
    $product = $data['product'] ?? 'Plena Aluguéis';
    $license_type = $data['license_type'] ?? 'monthly';
    $duration = $data['duration'] ?? 30;

    // Novos campos
    $is_manual = $data['is_manual'] ?? false;
    $custom_price = isset($data['price']) ? floatval($data['price']) : null;
    $cpf = $data['cpf'] ?? '';
    $whatsapp = $data['whatsapp'] ?? '';

    if (empty($client))
        jsonResponse(['error' => 'Email/Cliente obrigatório'], 400);

    global $CATALOG_MASTER;
    // Usa preço customizado se informado, senão pega do catálogo
    $final_price = $custom_price !== null ? $custom_price : ($CATALOG_MASTER[$product]['price'] ?? 97.00);

    // ------------------------------------------------------------------
    // LOGICA DE CUPOM E PARCEIROS (NEXUS 2.0)
    // ------------------------------------------------------------------
    $coupon_code = $data['coupon'] ?? '';
    $partner_id = null;
    $discount_val = 0;

    if (!empty($coupon_code)) {
        $partners_db = json_decode(@file_get_contents($PARTNERS_FILE), true) ?? [];
        foreach ($partners_db as $p) {
            if (strtoupper($p['code']) === strtoupper($coupon_code) && ($p['status'] ?? 'active') === 'active') {
                $partner_id = $p['id'];
                $partner_desc = $p['name'];

                // Aplica Desconto (Se configurado)
                $disc_percent = $p['discount_percent'] ?? 0;
                if ($disc_percent > 0 && !$is_manual) { // Só aplica desconto se não for venda manual com preço fixo
                    // Se for venda de site, o preço final já vem "descontado" da gateway ou calculamos aqui?
                    // Assumindo que aqui geramos a licença APÓS o pagamento, o valor $final_price já é o pago.
                    // Mas se formos gerar link de pagamento, aí aplicariamos.
                    // Como este endpoint cria a licença FINAL, assumimos que $final_price é o valor real da transação.
                }

                // Calcula Comissão
                $comm_percent = $p['commission_percent'] ?? 0;
                $commission_val = ($final_price * $comm_percent) / 100;

                // Atualiza Ledger do Parceiro
                $p['sales_count'] = ($p['sales_count'] ?? 0) + 1;
                $p['pending_commission'] = ($p['pending_commission'] ?? 0) + $commission_val;

                // Salva alteração no parceiro
                // NOTA: Para performance extrema em flat-file, ideal seria ter arquivo separado, 
                // mas vamos atualizar o array principal por enquanto.
                // Precisamos reencontrar o índice correto pois estamos num foreach
                foreach ($partners_db as $idx => $pp) {
                    if ($pp['id'] === $p['id']) {
                        $partners_db[$idx] = $p;
                        break;
                    }
                }
                @file_put_contents($PARTNERS_FILE, json_encode($partners_db, JSON_PRETTY_PRINT));

                // Log sistemico
                systemLog("Venda atribuída ao parceiro {$p['name']} (Cupom: $coupon_code). Comissão: R$ $commission_val", 'money');
                break;
            }
        }
    }
    // ------------------------------------------------------------------

    // Formato Padronizado: PLENA-XXXX-XXXX
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));

    $newLicense = [
        "client" => $client,
        "cpf" => $cpf,
        "whatsapp" => $whatsapp,
        "product" => $product,
        "price" => $final_price,
        "license_type" => $license_type,
        "duration" => $duration,
        "device_id" => null,
        "status" => 'active',
        "created_at" => date('Y-m-d H:i:s'),
        "expires_at" => date('Y-m-d H:i:s', strtotime("+$duration days")),
        "payment_id" => $is_manual ? "MANUAL_" . date('YmdHis') : "API_" . uniqid(),
        "is_manual" => $is_manual,
        "partner_id" => $partner_id, // Link
        "app_link" => "https://www.plenaaplicativos.com.br/apps.plus/" . strtolower(str_replace([' ', 'é', 'ê', 'á', 'ã', 'ç', 'í', 'ó', 'ô', 'ú'], ['_', 'e', 'e', 'a', 'a', 'c', 'i', 'o', 'o', 'u'], $product)) . "/index.html"
    ];

    // 1. Salva Licença
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $db[$key] = $newLicense;
    @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT), LOCK_EX);

    // 2. Integração Financeira (Automática)
    if ($final_price > 0) {
        $desc = $is_manual ? "Venda Manual: $product - $client" : "Venda Online: $product - $client";
        $cat = $is_manual ? "venda_manual" : "venda_online";
        if ($partner_id)
            $desc .= " [Parceiro: $partner_desc]";

        // Helper function handles DB read/write/lock
        addFinancialTransaction('income', $final_price, $desc, $cat, $key);
    }

    jsonResponse(["success" => true, "license_key" => $key]);
}

// UPDATE STATUS
if ($action === 'update_status') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $key = $data['key'] ?? '';
    $status = $data['status'] ?? '';

    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    if (!isset($db[$key]))
        jsonResponse(['error' => 'Licença não encontrada'], 404);

    if ($status === 'reset_device') {
        $db[$key]['device_id'] = null;
    } else {
        $db[$key]['status'] = $status;
    }
    @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    jsonResponse(['success' => true]);
}

// RESEND EMAIL
if ($action === 'resend_email') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    if (file_exists('api_mailer.php'))
        require_once 'api_mailer.php';
    else
        jsonResponse(['error' => 'Mailer not found'], 500);

    $key = $data['key'] ?? '';
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];

    if (!isset($db[$key]))
        jsonResponse(['error' => 'Licença não encontrada'], 404);

    $l = $db[$key];
    $sent = sendLicenseEmail($l['client'], $l['product'], $key, $l['app_link']);

    if ($sent)
        jsonResponse(['success' => true, 'message' => 'Email reenviado']);
    else
        jsonResponse(['error' => 'Falha no envio'], 500);
}

// RENEW LICENSE
if ($action === 'renew') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $key = $data['key'] ?? '';
    $days = intval($data['days'] ?? 30);

    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    if (!isset($db[$key]))
        jsonResponse(['error' => 'Licença não encontrada'], 404);

    $current_exp = $db[$key]['expires_at'];
    // Se já venceu, soma a partir de hoje. Se não, soma do vencimento atual.
    $base_date = (strtotime($current_exp) < time()) ? time() : strtotime($current_exp);
    $new_exp = date('Y-m-d H:i:s', strtotime("+$days days", $base_date));

    $db[$key]['expires_at'] = $new_exp;
    $db[$key]['status'] = 'active'; // Reativa se estiver expirada

    @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));

    // Finance Integration for Renewal
    $price = isset($data['price']) ? floatval($data['price']) : 0;
    if ($price > 0) {
        $desc = "Renovação de Licença: $key";
        addFinancialTransaction('income', $price, $desc, 'renovacao', $key);
    }

    jsonResponse(['success' => true, 'new_expiry' => $new_exp]);
}

// MANUAL FINANCE ENTRY
if ($action === 'finance_add') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $type = $data['type'] ?? 'expense'; // income or expense
    $amount = floatval($data['amount'] ?? 0);
    $description = $data['description'] ?? 'Lançamento Manual';
    $category = $data['category'] ?? 'outros';

    if ($amount <= 0)
        jsonResponse(['error' => 'Valor inválido'], 400);

    $transaction = addFinancialTransaction($type, $amount, $description, $category);
    jsonResponse(['success' => true, 'transaction' => $transaction]);
}

// BACKUP
if ($action === 'backup_system') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $zip = new ZipArchive();
    $zipfile = $DATA_DIR . 'backup_' . date('Ymd_His') . '.zip';
    if ($zip->open($zipfile, ZipArchive::CREATE) === TRUE) {
        if (file_exists($DB_FILE))
            $zip->addFile($DB_FILE, 'licenses.json');
        if (file_exists($LEADS_FILE))
            $zip->addFile($LEADS_FILE, 'leads.json');
        $zip->close();
        jsonResponse(['success' => true, 'file' => basename($zipfile)]);
    } else {
        jsonResponse(['error' => 'Zip failed'], 500);
    }
}

// ==================================================================
// 8. GERENCIAMENTO DE APPS
// ==================================================================

// LIST APPS with AUTO-SCAN & PERSISTENCE
if ($action === 'list_apps') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    // 1. Scan filesystem (APPS.PLUS - Flat Structure)
    $apps_dir = __DIR__ . '/apps.plus';
    $found_apps = [];

    if (is_dir($apps_dir)) {
        $apps = scandir($apps_dir);
        foreach ($apps as $app) {
            if ($app === '.' || $app === '..')
                continue;
            $app_path = $apps_dir . '/' . $app;

            // Check for index.html existence
            if (is_dir($app_path) && file_exists($app_path . '/index.html')) {
                // Try to guess category from catalog
                global $CATALOG_MASTER;
                $category = 'plus';
                $price = 97.00;

                // Try to find in catalog by matching slug
                foreach ($CATALOG_MASTER as $name => $details) {
                    $slug = strtolower(str_replace([' ', 'é', 'ê', 'á', 'ã', 'ç', 'í', 'ó', 'ô', 'ú'], ['_', 'e', 'e', 'a', 'a', 'c', 'i', 'o', 'o', 'u'], $name));
                    if ($slug === $app) {
                        $category = $details['category'] ?? 'plus';
                        $price = $details['price'] ?? 97.00;
                        break;
                    }
                }

                $found_apps[$app] = [
                    'slug' => $app,
                    'name' => str_replace('_', ' ', ucfirst($app)),
                    'category' => $category,
                    'path' => "apps.plus/$app/index.html",
                    'price' => $price
                ];
            }
        }
    }

    // 2. Merge with Saved Config
    $CONFIG_FILE = $DATA_DIR . 'apps_config.json';
    $saved_config = json_decode(@file_get_contents($CONFIG_FILE), true) ?? [];

    foreach ($found_apps as $slug => $app_data) {
        if (isset($saved_config[$slug])) {
            // Override with saved data
            if (isset($saved_config[$slug]['price']))
                $found_apps[$slug]['price'] = $saved_config[$slug]['price'];
            if (isset($saved_config[$slug]['name']))
                $found_apps[$slug]['name'] = $saved_config[$slug]['name'];
        }
    }

    // Re-index to array for frontend
    jsonResponse(array_values($found_apps));
}

// UPDATE APP CONFIG
if ($action === 'update_app') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $slug = $data['slug'] ?? '';
    if (!$slug)
        jsonResponse(['error' => 'Slug missing'], 400);

    $CONFIG_FILE = $DATA_DIR . 'apps_config.json';
    $config = json_decode(@file_get_contents($CONFIG_FILE), true) ?? [];

    if (!isset($config[$slug]))
        $config[$slug] = [];

    if (isset($data['price']))
        $config[$slug]['price'] = floatval($data['price']);
    if (isset($data['name']))
        $config[$slug]['name'] = $data['name'];

    @file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT));
    jsonResponse(['success' => true]);
}


// ==================================================================
// 9. GERENCIAMENTO DE PARCEIROS
// ==================================================================
// $PARTNERS_FILE já definido no topo

// LIST PARTNERS
if ($action === 'list_partners') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);
    $partners = json_decode(@file_get_contents($PARTNERS_FILE), true) ?? [];
    if (!empty($partners) && array_keys($partners) !== range(0, count($partners) - 1))
        $partners = array_values($partners);
    jsonResponse($partners);
}

// SAVE PARTNER
if ($action === 'save_partner') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $partner = $data['partner'] ?? [];
    $is_edit = $data['is_edit'] ?? false;

    if (empty($partner['name']) || empty($partner['code']))
        jsonResponse(['error' => 'Dados incompletos'], 400);

    $partners = json_decode(@file_get_contents($PARTNERS_FILE), true) ?? [];
    if (!empty($partners) && array_keys($partners) !== range(0, count($partners) - 1))
        $partners = array_values($partners);

    // Check duplicate code
    if (!$is_edit) {
        foreach ($partners as $p) {
            if (strtoupper($p['code']) === strtoupper($partner['code'])) {
                jsonResponse(['error' => 'Código de cupom já existe'], 400);
            }
        }
        $partner['id'] = generateId('partner_');
        $partner['sales_count'] = 0;
        $partner['created_at'] = date('Y-m-d H:i:s');
        $partners[] = $partner;
    } else {
        // (Optional: Edit Logic if needed later)
    }

    @file_put_contents($PARTNERS_FILE, json_encode($partners, JSON_PRETTY_PRINT));
    jsonResponse(['success' => true, 'partner' => $partner]);
}

// DELETE PARTNER
if ($action === 'delete_partner') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $id = $data['id'] ?? '';
    $partners = json_decode(@file_get_contents($PARTNERS_FILE), true) ?? [];
    if (!empty($partners) && array_keys($partners) !== range(0, count($partners) - 1))
        $partners = array_values($partners);

    $new_partners = [];
    foreach ($partners as $p) {
        if ($p['id'] !== $id)
            $new_partners[] = $p;
    }

    @file_put_contents($PARTNERS_FILE, json_encode($new_partners, JSON_PRETTY_PRINT));
    jsonResponse(['success' => true]);
}

// ==================================================================
// 10. GESTÃO FINANCEIRA E PARCEIROS (AVANÇADO)
// ==================================================================

// FINANCE OPERATION (Income/Expense/Withdraw)
if ($action === 'finance_op') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $type = $data['type'] ?? ''; // income, expense, withdraw
    $val = floatval($data['value'] ?? 0);
    $desc = $data['description'] ?? 'Sem descrição';

    if (!in_array($type, ['income', 'expense', 'withdraw']) || $val <= 0) {
        jsonResponse(['error' => 'Dados inválidos'], 400);
    }

    $finance_db = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];

    // Se for retirada/despesa, o valor entra negativo no log visual ou lógica de saldo?
    // Mantemos o valor absoluto no registro, o 'type' define a matemática

    $finance_db[] = [
        'id' => generateId('fin_'),
        'date' => date('Y-m-d H:i:s'),
        'description' => $desc,
        'value' => $val,
        'type' => $type,
        'user' => 'admin'
    ];

    @file_put_contents($FINANCE_FILE, json_encode($finance_db, JSON_PRETTY_PRINT), LOCK_EX);
    jsonResponse(['success' => true]);
}

// SETTLE PARTNER (Fechar Caixa de Parceiro)
if ($action === 'settle_partner') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $pid = $data['partner_id'] ?? '';
    if (!$pid)
        jsonResponse(['error' => 'ID obrigatório'], 400);

    $partners = json_decode(@file_get_contents($PARTNERS_FILE), true) ?? [];
    $found = false;

    foreach ($partners as &$p) {
        if ($p['id'] === $pid) {
            $found = true;
            // Zera comissões pendentes (supondo que sales_count seja usado para calc, ou se houver um saldo específico)
            // Lógica Simplificada: Resetamos 'pending_balance' (se existisse) ou apenas registramos pagamento
            // Como a estrutura atual é simples, vamos criar um campo 'last_payout' e logging.

            $payout_amount = $data['amount'] ?? 0;

            // Registra Pagamento no Histórico do Parceiro
            if (!isset($p['payout_history']))
                $p['payout_history'] = [];
            $p['payout_history'][] = [
                'date' => date('Y-m-d H:i:s'),
                'amount' => $payout_amount
            ];

            // Registra Saída no Financeiro
            $finance_db = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];
            $finance_db[] = [
                'id' => generateId('fin_pay_'),
                'date' => date('Y-m-d H:i:s'),
                'description' => "Pagamento Comissão: {$p['name']}",
                'value' => $payout_amount,
                'type' => 'expense', // Despesa para a empresa
                'user' => 'admin'
            ];
            @file_put_contents($FINANCE_FILE, json_encode($finance_db, JSON_PRETTY_PRINT), LOCK_EX);

            break;
        }
    }

    if ($found) {
        @file_put_contents($PARTNERS_FILE, json_encode($partners, JSON_PRETTY_PRINT), LOCK_EX);
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Parceiro não encontrado'], 404);
    }
}


// ADMIN DASHBOARD STATS
if ($action === 'dashboard_stats') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    // Load Data
    $finance = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];
    $licenses = json_decode(@file_get_contents($DB_FILE), true) ?? [];

    $total_revenue = 0;
    $monthly_revenue = 0;
    $current_month = date('Y-m');

    // Calc Revenue
    foreach ($finance as $t) {
        if (($t['type'] ?? '') === 'income') {
            $val = floatval($t['amount'] ?? 0);
            $total_revenue += $val;
            if (strpos($t['date'], $current_month) === 0) {
                $monthly_revenue += $val;
            }
        }
    }

    // Calc Licenses
    $active_count = 0;
    $devices_count = 0;
    $top_products = [];

    foreach ($licenses as $l) {
        if (($l['status'] ?? '') === 'active') {
            $active_count++;
        }
        if (!empty($l['device_id'])) {
            $devices_count++;
        }
        $prod = $l['product'] ?? 'Desconhecido';
        if (!isset($top_products[$prod]))
            $top_products[$prod] = 0;
        $top_products[$prod]++;
    }

    arsort($top_products);
    $top_products = array_slice($top_products, 0, 5);

    jsonResponse([
        'total_revenue' => $total_revenue,
        'monthly_revenue' => $monthly_revenue,
        'active_subscriptions' => $active_count,
        'active_devices_count' => $devices_count,
        'top_products' => $top_products
    ]);
}

// LIST ALL LICENSES
if ($action === 'list') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $list = [];
    foreach ($db as $key => $val) {
        $val['key'] = $key; // Inject key
        $list[] = $val;
    }
    // Sort by Date DESC
    usort($list, function ($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    jsonResponse($list);
}

// GET RECEIPTS
if ($action === 'get_receipts') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $receipts = json_decode(@file_get_contents($RECEIPTS_FILE), true) ?? [];
    // Ensure array list
    if (!empty($receipts) && array_keys($receipts) !== range(0, count($receipts) - 1))
        $receipts = array_values($receipts);

    jsonResponse(array_reverse($receipts));
}

// READ SYSTEM LOGS
if ($action === 'read_logs') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    if (file_exists($DEBUG_LOG)) {
        $lines = file($DEBUG_LOG);
        // Pega as últimas 50
        $lines = array_slice($lines, -50);

        $json_logs = [];
        foreach ($lines as $line) {
            $json_logs[] = ['msg' => trim($line)];
        }
        // Inverte para exibir mais recente no topo
        jsonResponse(['logs' => array_reverse($json_logs)]);
    } else {
        jsonResponse(['logs' => []]);
    }
}

// ==================================================================
// 11. SISTEMA DE NOTIFICAÇÕES (BROADCAST)
// ==================================================================

// SEND NOTIFICATION
if ($action === 'send_notification') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $title = $data['title'] ?? '';
    $message = $data['message'] ?? '';
    $type = $data['type'] ?? 'info'; // info, warning, error, success
    $target = $data['target'] ?? 'all'; // all, app_specific
    $expires_at = $data['expires_at'] ?? null; // YYYY-MM-DD

    if (empty($title) || empty($message))
        jsonResponse(['error' => 'Título e mensagem obrigatórios'], 400);

    $notif_db = json_decode(@file_get_contents($NOTIFICATIONS_FILE), true) ?? [];

    // CORREÇÃO: Captura explícita do booleano
    $requireRead = $data['requireRead'] ?? false;

    $new_notif = [
        'id' => generateId('notif_'),
        'date' => date('Y-m-d H:i:s'),
        'title' => $title,
        'message' => $message,
        'type' => $type,
        'target' => $target,
        'requireRead' => $requireRead, // <--- ADICIONAR ESTA LINHA
        'expires_at' => $expires_at,
        'created_by' => 'admin'
    ];

    // Adiciona no início
    array_unshift($notif_db, $new_notif);

    // Limita tamanho (opcional, ex: manter últimas 50)
    if (count($notif_db) > 50) {
        $notif_db = array_slice($notif_db, 0, 50);
    }

    @file_put_contents($NOTIFICATIONS_FILE, json_encode($notif_db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    jsonResponse(['success' => true, 'notification' => $new_notif]);
}

// CLEAR NOTIFICATIONS (NEW)
if ($action === 'clear_notifications') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    @file_put_contents($NOTIFICATIONS_FILE, json_encode([], JSON_PRETTY_PRINT));
    systemLog("Todas as notificações foram limpas pelo admin.", 'warning');
    jsonResponse(['success' => true]);
}

// GET NOTIFICATIONS (FOR CLIENT APPS)
// Essa action pode ser pública, pois os apps clientes precisam consultar
// Mas idealmente validaríamos se a licença é válida. Por simplicidade, deixaremos público para "all".
// ==================================================================
// [UPDATED] GET NOTIFICATIONS (SECURE & SEGMENTED)
// ==================================================================

// ADMIN GET NOTIFICATIONS (FULL HISTORY)
if ($action === 'admin_get_notifications') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $notif_db = json_decode(@file_get_contents($NOTIFICATIONS_FILE), true) ?? [];
    jsonResponse(['notifications' => $notif_db]);
}

if ($action === 'get_notifications') {
    // 1. Mudança para POST e Leitura do Input Seguro
    if ($method !== 'POST') {
        jsonResponse(['error' => 'Method Not Allowed. Use POST.'], 405);
    }

    // Recupera a chave do corpo da requisição (JSON)
    $input_key = $data['license_key'] ?? '';

    // 2. Validação da Licença (Security Gate)
    // Se não enviar chave, retorna vazio (Silent Fail para modo Demo)
    if (empty($input_key)) {
        jsonResponse(['notifications' => []]);
    }

    // --- MASTER KEY HANDLING FOR NOTIFICATIONS ---
    $ALLOWED_MASTERS = [$ADMIN_SECRET, 'PLENA_MASTER_TEST_2026'];
    if (in_array($input_key, $ALLOWED_MASTERS)) {
        // Cria uma "licença virtual" que vê tudo
        $license_data = [
            'status' => 'active',
            'product' => 'MASTER', // Vê target='all' ou target='MASTER'
            'activated_at' => '2020-01-01 00:00:00', // Vê histórico antigo
            'created_at' => '2020-01-01 00:00:00'
        ];
        // Pula o lookup de DB
        goto skip_db_lookup; // Sim, goto é feio mas prático aqui para não identar tudo
    }
    // ---------------------------------------------

    $db_content = @file_get_contents($DB_FILE);
    $db = $db_content ? json_decode($db_content, true) : [];

    // Busca Case Insensitive
    $license_data = null;
    if (isset($db[$input_key])) {
        $license_data = $db[$input_key];
    } else {
        foreach ($db as $k => $v) {
            if (strtoupper($k) === strtoupper($input_key)) {
                $license_data = $v;
                break;
            }
        }
    }

    // Se licença não existe ou não está ativa, retorna vazio
    if (!$license_data || ($license_data['status'] ?? '') !== 'active') {
        jsonResponse(['notifications' => []]);
    }

    skip_db_lookup:

    // 3. Definição da Linha do Tempo (Time-Travel Logic)
    // O usuário só vê mensagens criadas DEPOIS que ele ativou a licença
    $start_date = $license_data['activated_at'] ?? $license_data['created_at'] ?? date('Y-m-d H:i:s');
    $product_name = $license_data['product'] ?? '';

    // 4. Filtragem das Notificações
    $notif_db = json_decode(@file_get_contents($NOTIFICATIONS_FILE), true) ?? [];
    $valid_notifs = [];
    $now = date('Y-m-d H:i:s');

    foreach ($notif_db as $n) {
        // Filtro A: Expiração (Data de validade da mensagem)
        if (!empty($n['expires_at'])) {
            $exp_time = strlen($n['expires_at']) === 10 ? $n['expires_at'] . ' 23:59:59' : $n['expires_at'];
            if ($exp_time < $now)
                continue;
        }

        // Filtro B: Target (Alvo da mensagem)
        // Aceita se for 'all' OU se corresponder ao produto da licença OU se for MASTER (vê tudo)
        $target = $n['target'] ?? 'all';
        $target_norm = strtolower(str_replace([' ', '_', '-'], '', $target));
        $prod_norm = strtolower(str_replace([' ', '_', '-'], '', $product_name));

        if ($target !== 'all' && $product_name !== 'MASTER') {
            // Comparação Normalizada para evitar erros de string (Ex: "Plena Checklist" vs "plena_checklist")
            if ($target_norm !== $prod_norm) {
                continue;
            }
        }

        // Filtro C: Linha do Tempo (Data de criação da mensagem)
        // Mensagem deve ser mais recente que a ativação da licença
        $msg_date = $n['date'] ?? '1970-01-01';
        if ($msg_date < $start_date) {
            continue;
        }

        $valid_notifs[] = $n;
    }
    jsonResponse(['notifications' => $valid_notifs]);
}

// READ LOGS (NEW - Phase 4.2)
if ($action === 'read_logs') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $logs = [];
    if (file_exists($LOGS_FILE)) {
        // Read last 50 lines for performance
        $lines = file($LOGS_FILE);
        $logs_raw = array_slice($lines, -50);
        foreach ($logs_raw as $l) {
            $json = json_decode($l, true);
            if ($json)
                $logs[] = $json;
        }
        $logs = array_reverse($logs); // Newest first
    }
    jsonResponse(['logs' => $logs]);
}

// SYSTEM DIAGNOSIS (NEW)
if ($action === 'system_diagnosis') {
    if (!checkAuth($data, $_GET, $server))
        jsonResponse(['error' => 'Acesso Negado'], 403);

    $status = [
        'db' => is_writable($DB_FILE) && is_writable($LEADS_FILE),
        'smtp' => file_exists('SimpleMailer.php') && (defined('SMTP_HOST') || getenv('SMTP_HOST')),
        'mp' => !empty($MP_ACCESS_TOKEN)
    ];

    systemLog("Diagnóstico do Sistema executado pelo Admin.", 'info');
    jsonResponse(['status' => $status]);
}


// DEFAULT
jsonResponse([
    "status" => "online",
    "version" => SYSTEM_VERSION,
    "timestamp" => date('Y-m-d H:i:s')
]);