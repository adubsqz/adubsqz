import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ABOUT } from './data';

describe('App', () => {
  it('renders navigation with Program and Liner notes tabs', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: /program/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /liner notes/i })).toBeInTheDocument();
  });

  it('shows Gallery view by default', () => {
    render(<App />);
    expect(screen.getByText(/strip index/i)).toBeInTheDocument();
  });

  it('switches to About view when Liner notes tab is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /liner notes/i }));
    const aboutPanel = screen.getByRole('tabpanel');
    expect(within(aboutPanel).getByText(ABOUT.tagline)).toBeInTheDocument();
    expect(within(aboutPanel).getByText(ABOUT.name)).toBeInTheDocument();
  });

  it('switches back to Gallery when Program tab is clicked after viewing About', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /liner notes/i }));
    await user.click(screen.getByRole('tab', { name: /program/i }));
  });

  it('opens contact modal when Contact me is clicked from About page', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /liner notes/i }));
    await user.click(screen.getByRole('button', { name: /contact me/i }));
    expect(screen.getByRole('dialog', { name: /contact/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('closes contact modal when Close is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /liner notes/i }));
    await user.click(screen.getByRole('button', { name: /contact me/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
