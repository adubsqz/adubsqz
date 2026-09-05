import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WatermarkedImage from './WatermarkedImage';

describe('WatermarkedImage', () => {
  it('shows overlay watermarks after load and forwards click on the shield', () => {
    const onClick = vi.fn();
    const { container } = render(
      <WatermarkedImage src="/photos/still-life/color/x.jpg" alt="Neon" onClick={onClick} />,
    );
    fireEvent.load(screen.getByAltText('Neon'));
    expect(screen.getAllByText(/adubsqz/i).length).toBeGreaterThan(0);
    const shield = container.querySelector('.absolute.inset-0.z-10');
    expect(shield).toBeTruthy();
    fireEvent.click(shield!);
    expect(onClick).toHaveBeenCalled();
  });
});
