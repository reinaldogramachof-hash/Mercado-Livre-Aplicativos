
import os

def fix_app_html():
    path = r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(path, 'r', encoding='latin-1') as f:
                content = f.read()
        except:
            print("Erro ao ler app.html")
            return

    # Correções de Encoding Específicas
    corrections = {
        'âš\xa0ï¸\x8f Importante': '⚠️ Importante',
        'âš ï¸ Importante': '⚠️ Importante', # Variação possível
        'Ã cone': 'Ícone',
        '📲±': '📱',
        'âš¡': '⚡',
        'Ã\xa0s': 'às', # Caso tenha sobrado
        'ConferÃªncia': 'Conferência'
    }

    for old, new in corrections.items():
        content = content.replace(old, new)
    
    # Salvar
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("app.html corrigido.")

def fix_app_core_js():
    path = r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\js\app_core.js'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print("Erro ao ler app_core.js")
        return

    # Novo Template WhatsApp
    new_template = """function shareCommissionWhatsApp() {
    if (!currentCommissionData) return;
    const salonName = db.settings.businessName || 'SUA BARBEARIA';

    let msg = `💰 *PAGAMENTO DE COMISSÃO*\\n`;
    msg += `💈 ${salonName.toUpperCase()}\\n`;
    msg += `📅 ${fmtDate(currentCommissionData.date)}\\n`;
    msg += `--------------------------------\\n`;
    msg += `👤 Barbeiro: *${currentCommissionData.proName}*\\n`;
    msg += `💵 Valor Pago: *${fmtMoney(currentCommissionData.amount)}*\\n`;
    msg += `--------------------------------\\n`;
    msg += `✅ *PAGAMENTO CONFIRMADO*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}"""

    # Encontrar a função antiga e substituir (abordagem simples por start/end markers se possível, ou replace de bloco conhecido)
    # Como o replace falhou antes, vou tentar substituir o bloco inteiro identificado anteriormente
    
    # Bloco antigo aproximado (baseado no que li no view_file)
    # Vou usar regex ou split para ser mais seguro, mas vou tentar replace direto de strings unicas primeiro
    
    target_start = "function shareCommissionWhatsApp() {"
    target_end = "window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');"
    
    start_idx = content.find(target_start)
    if start_idx != -1:
        # Achar o fechamento da função
        # Assumindo que a função termina com } logo após o window.open
        end_idx = content.find("}", content.find(target_end)) + 1
        
        if end_idx != 0:
            old_func = content[start_idx:end_idx]
            content = content.replace(old_func, new_template)
            print("Template WhatsApp atualizado.")
        else:
            print("Fim da função WhatsApp não encontrado.")
    else:
        print("Função WhatsApp não encontrada.")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_app_html()
    fix_app_core_js()
