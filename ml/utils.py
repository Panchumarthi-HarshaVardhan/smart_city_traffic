"""
CityFlow AI - Utility Functions
=================================
Shared helpers used across the ML pipeline: path management, metrics,
logging, I/O, and display utilities.
"""

import logging
import os
import sys

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

def get_project_root():
    """Return the absolute path to the project root directory.

    The project root is the parent of the ``ml/`` package that contains
    this module.

    Returns
    -------
    str
        Absolute path to the project root.
    """
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ensure_directories():
    """Create every directory the project pipeline needs.

    Delegates to :func:`ml.config.setup_directories` so there is a single
    source of truth for the directory list.  Safe to call multiple times.
    """
    # Import here to avoid circular imports at module level
    from ml.config import setup_directories
    setup_directories()


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def calculate_metrics(y_true, y_pred):
    """Compute regression metrics for model evaluation.

    Parameters
    ----------
    y_true : array-like
        Ground-truth values.
    y_pred : array-like
        Predicted values.

    Returns
    -------
    dict
        Keys: ``mae``, ``rmse``, ``r2``, and optionally ``mape``
        (only included when *y_true* contains no zeros, to avoid
        division-by-zero in the percentage error calculation).
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)

    # Remove any NaN pairs
    mask = ~(np.isnan(y_true) | np.isnan(y_pred))
    y_true = y_true[mask]
    y_pred = y_pred[mask]

    if len(y_true) == 0:
        return {"mae": np.nan, "rmse": np.nan, "r2": np.nan}

    errors = y_true - y_pred
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1 - ss_res / ss_tot) if ss_tot != 0 else 0.0

    metrics = {"mae": mae, "rmse": rmse, "r2": r2}

    # MAPE only when no zeros in y_true
    if np.all(y_true != 0):
        mape = float(np.mean(np.abs(errors / y_true)) * 100)
        metrics["mape"] = mape

    return metrics


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def setup_logging(name="cityflow", level=logging.INFO):
    """Configure and return a logger with console + optional file output.

    Parameters
    ----------
    name : str, optional
        Logger name (default ``"cityflow"``).
    level : int, optional
        Logging level (default ``logging.INFO``).

    Returns
    -------
    logging.Logger
        Configured logger instance.
    """
    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers when called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(level)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (placed in reports/ if it exists)
    from ml.config import REPORTS_DIR
    log_file = os.path.join(REPORTS_DIR, "cityflow.log")
    try:
        os.makedirs(REPORTS_DIR, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except OSError:
        logger.warning("Could not create file handler at %s", log_file)

    return logger


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------

def print_section(title):
    """Print a visually distinct section header to stdout.

    Parameters
    ----------
    title : str
        Section title text.
    """
    width = 60
    print("\n" + "=" * width)
    print(f"  {title}")
    print("=" * width)


# ---------------------------------------------------------------------------
# Math helpers
# ---------------------------------------------------------------------------

def safe_divide(a, b, default=0.0):
    """Return ``a / b``, falling back to *default* when *b* is zero.

    Parameters
    ----------
    a : float
        Numerator.
    b : float
        Denominator.
    default : float, optional
        Value returned when *b* is zero (default ``0.0``).

    Returns
    -------
    float
    """
    try:
        return a / b if b != 0 else default
    except (TypeError, ZeroDivisionError):
        return default


# ---------------------------------------------------------------------------
# Dataset I/O
# ---------------------------------------------------------------------------

def load_dataset(path):
    """Load a CSV file into a DataFrame with basic validation.

    Parameters
    ----------
    path : str
        Absolute or relative path to a ``.csv`` file.

    Returns
    -------
    pandas.DataFrame
        Loaded data.

    Raises
    ------
    FileNotFoundError
        If *path* does not exist.
    ValueError
        If the loaded DataFrame is empty.
    """
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path)

    if df.empty:
        raise ValueError(f"Dataset is empty: {path}")

    logger = logging.getLogger("cityflow")
    logger.info(
        "Loaded %s — %d rows × %d cols",
        os.path.basename(path),
        len(df),
        len(df.columns),
    )
    return df


def save_dataset(df, path):
    """Save a DataFrame to CSV, creating parent directories if needed.

    Parameters
    ----------
    df : pandas.DataFrame
        Data to persist.
    path : str
        Destination file path.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)

    logger = logging.getLogger("cityflow")
    logger.info(
        "Saved %s — %d rows × %d cols",
        os.path.basename(path),
        len(df),
        len(df.columns),
    )
