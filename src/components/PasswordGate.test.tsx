import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PasswordGate from './PasswordGate';

describe('PasswordGate', () => {
  it('renders children with no gate on the public shop', () => {
    render(
      <PasswordGate>
        <p>gallery</p>
      </PasswordGate>,
    );
    expect(screen.getByText('gallery')).toBeInTheDocument();
  });
});
