import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8f9fa;
    color: #343a40;
    line-height: 1.6;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  a {
    color: #007bff;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #0056b3;
      text-decoration: underline;
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.2s ease;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
    border: 1px solid #ced4da;
    border-radius: 4px;
    transition: border-color 0.2s ease;

    &:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    margin-bottom: 0;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    transition: all 0.15s ease-in-out;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      text-decoration: none;
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }

  .btn-primary {
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;

    &:hover:not(:disabled) {
      background-color: #0056b3;
      border-color: #004085;
    }
  }

  .btn-secondary {
    color: #fff;
    background-color: #6c757d;
    border-color: #6c757d;

    &:hover:not(:disabled) {
      background-color: #545b62;
      border-color: #4e555b;
    }
  }

  .btn-success {
    color: #fff;
    background-color: #28a745;
    border-color: #28a745;

    &:hover:not(:disabled) {
      background-color: #1e7e34;
      border-color: #1c7430;
    }
  }

  .btn-danger {
    color: #fff;
    background-color: #dc3545;
    border-color: #dc3545;

    &:hover:not(:disabled) {
      background-color: #bd2130;
      border-color: #b21f2d;
    }
  }

  .btn-warning {
    color: #212529;
    background-color: #ffc107;
    border-color: #ffc107;

    &:hover:not(:disabled) {
      background-color: #e0a800;
      border-color: #d39e00;
    }
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border-radius: 0.2rem;
  }

  .btn-lg {
    padding: 0.5rem 1rem;
    font-size: 1.25rem;
    line-height: 1.5;
    border-radius: 0.3rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    display: inline-block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .form-control {
    display: block;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #495057;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

    &:focus {
      color: #495057;
      background-color: #fff;
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    &::placeholder {
      color: #6c757d;
      opacity: 1;
    }

    &:disabled {
      background-color: #e9ecef;
      opacity: 1;
    }
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }

  .card-header {
    padding: 0.75rem 1.25rem;
    margin-bottom: 0;
    background-color: rgba(0, 0, 0, 0.03);
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    border-top-left-radius: calc(0.25rem - 1px);
    border-top-right-radius: calc(0.25rem - 1px);
  }

  .card-body {
    flex: 1 1 auto;
    padding: 1.25rem;
  }

  .table {
    width: 100%;
    margin-bottom: 1rem;
    background-color: transparent;
    border-collapse: collapse;

    th,
    td {
      padding: 0.75rem;
      vertical-align: top;
      border-top: 1px solid #dee2e6;
      text-align: left;
    }

    thead th {
      vertical-align: bottom;
      border-bottom: 2px solid #dee2e6;
      font-weight: 500;
      background-color: #f8f9fa;
    }

    tbody + tbody {
      border-top: 2px solid #dee2e6;
    }

    tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.075);
    }
  }

  .table-striped tbody tr:nth-of-type(odd) {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .alert {
    position: relative;
    padding: 0.75rem 1.25rem;
    margin-bottom: 1rem;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }

  .alert-primary {
    color: #004085;
    background-color: #cce7ff;
    border-color: #b3d7ff;
  }

  .alert-success {
    color: #155724;
    background-color: #d4edda;
    border-color: #c3e6cb;
  }

  .alert-danger {
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
  }

  .alert-warning {
    color: #856404;
    background-color: #fff3cd;
    border-color: #ffeaa7;
  }

  .badge {
    display: inline-block;
    padding: 0.25em 0.4em;
    font-size: 75%;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 0.25rem;
  }

  .badge-primary {
    color: #fff;
    background-color: #007bff;
  }

  .badge-success {
    color: #fff;
    background-color: #28a745;
  }

  .badge-danger {
    color: #fff;
    background-color: #dc3545;
  }

  .badge-warning {
    color: #212529;
    background-color: #ffc107;
  }

  .badge-secondary {
    color: #fff;
    background-color: #6c757d;
  }

  .spinner {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    vertical-align: text-bottom;
    border: 0.25em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border 0.75s linear infinite;
  }

  @keyframes spinner-border {
    to {
      transform: rotate(360deg);
    }
  }

  .d-flex {
    display: flex !important;
  }

  .justify-content-between {
    justify-content: space-between !important;
  }

  .align-items-center {
    align-items: center !important;
  }

  .mb-0 { margin-bottom: 0 !important; }
  .mb-1 { margin-bottom: 0.25rem !important; }
  .mb-2 { margin-bottom: 0.5rem !important; }
  .mb-3 { margin-bottom: 1rem !important; }
  .mb-4 { margin-bottom: 1.5rem !important; }
  .mb-5 { margin-bottom: 3rem !important; }

  .mt-0 { margin-top: 0 !important; }
  .mt-1 { margin-top: 0.25rem !important; }
  .mt-2 { margin-top: 0.5rem !important; }
  .mt-3 { margin-top: 1rem !important; }
  .mt-4 { margin-top: 1.5rem !important; }
  .mt-5 { margin-top: 3rem !important; }

  .mr-0 { margin-right: 0 !important; }
  .mr-1 { margin-right: 0.25rem !important; }
  .mr-2 { margin-right: 0.5rem !important; }
  .mr-3 { margin-right: 1rem !important; }

  .ml-0 { margin-left: 0 !important; }
  .ml-1 { margin-left: 0.25rem !important; }
  .ml-2 { margin-left: 0.5rem !important; }
  .ml-3 { margin-left: 1rem !important; }

  .text-center { text-align: center !important; }
  .text-left { text-align: left !important; }
  .text-right { text-align: right !important; }

  .text-muted { color: #6c757d !important; }
  .text-primary { color: #007bff !important; }
  .text-success { color: #28a745 !important; }
  .text-danger { color: #dc3545 !important; }
  .text-warning { color: #ffc107 !important; }

  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default GlobalStyles; 