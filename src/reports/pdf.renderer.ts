import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, type Browser } from 'playwright';

@Injectable()
export class PdfRenderer implements OnModuleDestroy {
  private readonly logger = new Logger(PdfRenderer.name);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleDestroy() {
    if (!this.browserPromise) return;
    try {
      const browser = await this.browserPromise;
      await browser.close();
    } catch (error) {
      this.logger.warn(`Failed to close Playwright browser: ${String(error)}`);
    } finally {
      this.browserPromise = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = this.launchBrowser().catch((error) => {
        this.browserPromise = null;
        throw error;
      });
    }
    return this.browserPromise;
  }

  private async launchBrowser(): Promise<Browser> {
    const executablePath = this.config
      .get<string>('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH')
      ?.trim();

    const launchAttempts: Array<() => Promise<Browser>> = [];

    if (executablePath) {
      launchAttempts.push(() =>
        chromium.launch({
          headless: true,
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }),
      );
    }

    launchAttempts.push(() =>
      chromium.launch({
        headless: true,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }),
    );

    launchAttempts.push(() =>
      chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }),
    );

    let lastError: unknown;
    for (const attempt of launchAttempts) {
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Playwright launch attempt failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    throw new ServiceUnavailableException(
      `Unable to launch Chromium for PDF generation: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }

  async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        preferCSSPageSize: true,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
