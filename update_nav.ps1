$path = "c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html"
$lines = Get-Content $path -Encoding UTF8

$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '<nav class="p-4 space-y-2 flex-1 overflow-y-auto">') {
        $startLine = $i
    }
    if ($startLine -ne -1 -and $lines[$i] -match '</nav>') {
        $endLine = $i
        break
    }
}

if ($startLine -eq -1 -or $endLine -eq -1) {
    Write-Host "Error: Could not find nav block."
    exit 1
}

$newNav = @(
    '        <nav class="p-4 space-y-2 flex-1 overflow-y-auto">',
    '            ',
    '            <!-- OPERACIONAL -->',
    '            <div class="px-4 mb-2 mt-2">',
    '                <span class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Operacional</span>',
    '            </div>',
    '            <button onclick="router(''dashboard'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group active-nav mb-1" id="nav-dashboard">',
    '                <i data-lucide="calendar" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Agenda</span>',
    '            </button>',
    '            <button onclick="router(''clients'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-clients">',
    '                <i data-lucide="user" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Clientes</span>',
    '            </button>',
    '            ',
    '            <!-- GESTÃO -->',
    '            <div class="px-4 mb-2 mt-4">',
    '                <span class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Gestão</span>',
    '            </div>',
    '            <button onclick="router(''finance'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-finance">',
    '                <i data-lucide="wallet" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Financeiro</span>',
    '            </button>',
    '            <button onclick="router(''reports'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-reports">',
    '                <i data-lucide="bar-chart-3" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Relatórios</span>',
    '            </button>',
    '            <button onclick="router(''team'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-team">',
    '                <i data-lucide="users" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Barbeiros</span>',
    '            </button>',
    '            <button onclick="router(''services'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-services">',
    '                <i data-lucide="scissors" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Serviços</span>',
    '            </button>',
    '            ',
    '            <!-- SISTEMA -->',
    '            <div class="px-4 mb-2 mt-4">',
    '                <span class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Sistema</span>',
    '            </div>',
    '            <button onclick="router(''settings'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-settings">',
    '                <i data-lucide="settings" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Configurações</span>',
    '            </button>',
    '            <button onclick="router(''instructions'')" class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group mb-1" id="nav-instructions">',
    '                <i data-lucide="book-open" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>',
    '                <span class="font-medium">Manual de Uso</span>',
    '            </button>',
    '        </nav>'
)

$finalLines = $lines[0..($startLine - 1)] + $newNav + $lines[($endLine + 1)..($lines.Count - 1)]
$finalLines | Set-Content $path -Encoding UTF8
Write-Host "Nav updated successfully."
