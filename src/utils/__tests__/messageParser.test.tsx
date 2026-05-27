import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { parseMessageWithKeywords, KeywordLink, extractKeywords } from '../messageParser';
import React from 'react';

describe('messageParser', () => {
  describe('extractKeywords', () => {
    it('extracts single keyword from message', () => {
      const message = 'Check out [{kw:"introduction"}] for more details.';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual(['introduction']);
    });
    
    it('extracts multiple keywords from message', () => {
      const message = 'The [{kw:"abstract"}] and [{kw:"methodology"}] sections are important.';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual(['abstract', 'methodology']);
    });
    
    it('handles keywords with spaces', () => {
      const message = 'See [{kw:"Chapter 1: Introduction"}] for context.';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual(['Chapter 1: Introduction']);
    });
    
    it('handles keywords with special characters', () => {
      const message = 'Refer to [{kw:"Section 4.2.1"}] and [{kw:"Figure-3A"}].';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual(['Section 4.2.1', 'Figure-3A']);
    });
    
    it('returns empty array when no keywords present', () => {
      const message = 'This is a regular message without keywords.';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual([]);
    });
    
    it('ignores malformed keyword patterns', () => {
      const message = 'Invalid [{kw:missing quotes}] and [{kw:"valid"}] patterns.';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual(['valid']);
    });
    
    it('handles empty keywords', () => {
      const message = 'Test [{kw:""}] empty keyword.';
      const keywords = extractKeywords(message);
      expect(keywords).toEqual(['']);
    });
  });
  
  describe('parseMessageWithKeywords', () => {
    it('returns original message when no keywords present', () => {
      const message = 'This is a regular message.';
      const result = parseMessageWithKeywords(message);
      expect(result).toEqual([message]);
    });
    
    it('parses single keyword and creates components', () => {
      const message = 'Check the [{kw:"introduction"}] section.';
      const result = parseMessageWithKeywords(message);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Check the ');
      expect(React.isValidElement(result[1])).toBe(true);
      expect(result[2]).toBe(' section.');
    });
    
    it('parses multiple keywords', () => {
      const message = 'See [{kw:"chapter 1"}] and [{kw:"chapter 2"}].';
      const result = parseMessageWithKeywords(message);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('See ');
      expect(React.isValidElement(result[1])).toBe(true);
      expect(result[2]).toBe(' and ');
      expect(React.isValidElement(result[3])).toBe(true);
      expect(result[4]).toBe('.');
    });
    
    it('handles keywords at the beginning of message', () => {
      const message = '[{kw:"Abstract"}] provides an overview.';
      const result = parseMessageWithKeywords(message);
      
      expect(result).toHaveLength(2);
      expect(React.isValidElement(result[0])).toBe(true);
      expect(result[1]).toBe(' provides an overview.');
    });
    
    it('handles keywords at the end of message', () => {
      const message = 'Read more in [{kw:"appendix"}]';
      const result = parseMessageWithKeywords(message);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Read more in ');
      expect(React.isValidElement(result[1])).toBe(true);
    });
    
    it('handles consecutive keywords', () => {
      const message = '[{kw:"first"}][{kw:"second"}]';
      const result = parseMessageWithKeywords(message);
      
      expect(result).toHaveLength(2);
      expect(React.isValidElement(result[0])).toBe(true);
      expect(React.isValidElement(result[1])).toBe(true);
    });
  });
  
  describe('KeywordLink', () => {
    let addEventListenerSpy: any;
    let dispatchEventSpy: any;
    
    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    it('renders keyword link with correct text', () => {
      render(<KeywordLink keyword="test keyword" />);
      expect(screen.getByText('test keyword')).toBeInTheDocument();
    });
    
    it('renders with search icon', () => {
      render(<KeywordLink keyword="test" />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
    
    it('has correct title attribute', () => {
      render(<KeywordLink keyword="methodology" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Search PDF for "methodology"');
    });
    
    it('dispatches pdf-search event on click', () => {
      render(<KeywordLink keyword="introduction" />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pdf-search',
          detail: { keyword: 'introduction' }
        })
      );
    });
    
    it('prevents default and stops propagation on click', () => {
      render(<KeywordLink keyword="test" />);
      const button = screen.getByRole('button');
      
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
      
      button.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
    
    it('applies correct styling classes', () => {
      render(<KeywordLink keyword="test" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('bg-blue-100');
      expect(button).toHaveClass('dark:bg-blue-900/30');
      expect(button).toHaveClass('text-blue-700');
      expect(button).toHaveClass('dark:text-blue-300');
    });
  });
  
  describe('Integration', () => {
    it('correctly renders a complex message with multiple keywords', () => {
      const message = 'The [{kw:"abstract"}] introduces the topic, while [{kw:"methodology"}] explains the approach.';
      const result = parseMessageWithKeywords(message);
      
      // Render the result
      const { container } = render(<div>{result}</div>);
      
      // Check text content
      expect(container.textContent).toBe('The abstract introduces the topic, while methodology explains the approach.');
      
      // Check that keyword buttons are present
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('abstract');
      expect(buttons[1]).toHaveTextContent('methodology');
    });
    
    it('handles edge case with empty keyword', () => {
      const message = 'Test [{kw:""}] empty keyword.';
      const result = parseMessageWithKeywords(message);
      
      // Should still create a component even for empty keyword
      expect(result).toHaveLength(3);
      expect(React.isValidElement(result[1])).toBe(true);
    });
  });
});