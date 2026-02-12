<?php
// ENGENHEIRO DEVOPS: ROUTER ANTI-CACHE
// OBJETIVO: Forcar o navegador a NUNCA cachear arquivos estaticos durante o desenvolvimento.

// 1. Headers Violentos Anti-Cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0");
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");

// 2. Identificar o arquivo solicitado
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$path = urldecode($path); // Fix para caminhos com espaco
$fullPath = $_SERVER["DOCUMENT_ROOT"] . $path;

// 3. Logica de Roteamento
if (file_exists($fullPath) && !is_dir($fullPath)) {
    $ext = pathinfo($fullPath, PATHINFO_EXTENSION);

    // Se for PHP, deixa o Servidor Embutido lidar (retornando false)
    // O PHP Embutido vai processar o script, mas os headers acima JÁ FORAM ENVIADOS.
    if ($ext === 'php') {
        return false;
    }

    // Se for Arquivo Estatico, servimos manualmente para GARANTIR que os headers nao sejam sobrescritos
    // Mime Types Basicos
    $mimes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'html' => 'text/html',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'map' => 'application/json'
    ];

    $mime = $mimes[$ext] ?? 'application/octet-stream';
    header("Content-Type: $mime");
    readfile($fullPath);
    exit;
}

// 4. Se nao existir, retorna false para o servidor padrao lidar (404)
return false;
?>