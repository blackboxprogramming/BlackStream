import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BlackStream heading', () => {
  render(<App />);
  const heading = screen.getByText(/BlackStream/i);
  expect(heading).toBeInTheDocument();
});

test('renders search input', () => {
  render(<App />);
  const input = screen.getByPlaceholderText(/Search shows/i);
  expect(input).toBeInTheDocument();
});

test('renders search button', () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /search/i });
  expect(button).toBeInTheDocument();
});
