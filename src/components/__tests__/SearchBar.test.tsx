import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';
import { act } from 'react';

const VALID_ADDR = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

// Helper to flush microtasks between timer steps
const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('<SearchBar />', () => {
  afterEach(() => {
    try {
      vi.useRealTimers();
    } catch {}
  });

  test('calls onSearch with entered address', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.type(screen.getByPlaceholderText(/bitcoin address/i), VALID_ADDR);
    await userEvent.click(screen.getByRole('button', { name: /explore/i }));
    expect(onSearch).toHaveBeenCalledWith(VALID_ADDR);
  });

  test('does not submit when input is blank', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: /explore/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  test('blocks submission while isLoading', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading />);
    await userEvent.type(screen.getByPlaceholderText(/bitcoin address/i), VALID_ADDR);
    await userEvent.click(screen.getByRole('button', { name: /loading/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });


  test('renders friendly rate-limit styling', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} error="Too many requests. Please slow down." retryAfter={5} />);

    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    expect(screen.getByText(/rate limiting helps protect/i)).toBeInTheDocument();
  });

  test('renders generic error styling for non-rate-limit errors', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} error="Internal server error" />);
    expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
  });
});
