import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ABOUT } from './data';

describe('App', () => {
  it('renders navigation with Gallery and About tabs', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: /gallery/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /about/i })).toBeInTheDocument();
  });

  it('shows Gallery view by default', () => {
    render(<App />);
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });

  it('switches to About view when About tab is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /about/i }));
    expect(screen.getByText(ABOUT.tagline)).toBeInTheDocument();
    expect(screen.getByText(ABOUT.name)).toBeInTheDocument();
  });

  it('switches back to Gallery when Gallery tab is clicked after viewing About', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /about/i }));
    await user.click(screen.getByRole('tab', { name: /gallery/i }));
  });

  it('opens contact modal when Contact me is clicked from About page', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /about/i }));
    await user.click(screen.getByRole('button', { name: /contact me/i }));
    expect(screen.getByRole('dialog', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('closes contact modal when Close is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /about/i }));
    await user.click(screen.getByRole('button', { name: /contact me/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
