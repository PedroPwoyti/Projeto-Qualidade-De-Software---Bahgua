/**
 * Conteúdo das abas planejadas.
 */
import { Icons } from '../components/icons.js';

export class PlanejadoView {
    static render() {
        return `
            <section class="development-placeholder">
                <div class="development-card">
                    <span class="development-icon" aria-hidden="true">${Icons.tools}</span>
                    <h2>Em desenvolvimento</h2>
                </div>
            </section>
        `;
    }
}
