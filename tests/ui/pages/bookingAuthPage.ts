import { expect, type Locator, type Page } from '@playwright/test';

export class BookingAuthPage {
  private readonly page: Page;
  private readonly signInTrigger: Locator;
  private readonly emailInput: Locator;
  private readonly continueButton: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInTrigger = page
      .getByRole('link', { name: /sign in/i })
      .or(page.getByRole('button', { name: /sign in/i }))
      .first();
    this.emailInput = page
      .getByRole('textbox', { name: /email/i })
      .or(page.locator('input[type="email"]'))
      .first();
    this.continueButton = page.getByRole('button', { name: /continue|next/i }).first();
    this.passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first();
    this.submitButton = page.getByRole('button', { name: /sign in|log in/i }).first();
  }

  async openSignIn(): Promise<void> {
    await expect(this.signInTrigger).toBeVisible();
    await this.signInTrigger.click();
  }

  async login(email: string, password: string): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await this.emailInput.fill(email);
    await this.continueButton.click();

    await expect(this.passwordInput).toBeVisible();
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
