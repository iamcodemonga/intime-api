import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import type { FleetComfortReportViewModel } from './report-view-model.js';

const HERE = dirname(fileURLToPath(import.meta.url));

@Injectable()
export class ReportHtmlRenderer {
  private readonly template: Handlebars.TemplateDelegate;
  private readonly inlineCss: string;

  constructor() {
    const templatePath = join(HERE, 'templates', 'fleet-comfort-report.html');
    const cssPath = join(HERE, 'templates', 'fleet-comfort-report.css');
    this.inlineCss = readFileSync(cssPath, 'utf8');
    this.template = Handlebars.compile(readFileSync(templatePath, 'utf8'), {
      strict: true,
      noEscape: false,
    });
  }

  render(viewModel: FleetComfortReportViewModel): string {
    return this.template({
      ...viewModel,
      styleTag: `<style>\n${this.inlineCss}\n</style>`,
    });
  }
}
