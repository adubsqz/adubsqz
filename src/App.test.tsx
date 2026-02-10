import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders navigation with Gallery and About', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /gallery/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument();
  });

  it('shows Gallery view by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /gallery/i })).toBeInTheDocument();
  });

  it('switches to About view when About is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /about/i }));
    expect(screen.getByText(/film, rediscovered/i)).toBeInTheDocument();
    expect(screen.getByText(/Alexander Ames/)).toBeInTheDocument();
  });

  it('switches back to Gallery when Gallery is clicked after viewing About', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /about/i }));
    await user.click(screen.getByRole('button', { name: /gallery/i }));
    expect(screen.getByRole('heading', { name: /gallery/i })).toBeInTheDocument();
  });

  it('opens contact modal when "Contact me" is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    const contactLink = screen.getByRole('button', { name: /contact me/i });
    await user.click(contactLink);
    expect(screen.getByRole('dialog', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('closes contact modal when Close button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /contact me/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
