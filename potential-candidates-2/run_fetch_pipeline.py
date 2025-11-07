#!/usr/bin/env python3
"""
Master orchestrator for Archive.org fetch pipeline

Runs all 3 steps in sequence:
1. Search and discover works
2. Download works
3. Convert to markdown

Can also run individual steps.
"""

import sys
import argparse
from pathlib import Path
import subprocess

from config import *
from utils import *

logger = setup_logging(PROGRESS_LOG)

def run_step(step_number: int, step_name: str, script_path: Path) -> bool:
    """Run a pipeline step."""
    logger.info("\n" + "="*80)
    logger.info(f"STEP {step_number}: {step_name}")
    logger.info("="*80)

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=BASE_DIR,
            capture_output=False,
            text=True
        )

        if result.returncode == 0:
            logger.info(f"✓ Step {step_number} completed successfully")
            return True
        else:
            logger.error(f"✗ Step {step_number} failed with return code {result.returncode}")
            return False

    except Exception as e:
        logger.error(f"✗ Step {step_number} failed with exception: {e}")
        return False

def run_full_pipeline(skip_steps: list = None):
    """Run the complete fetch pipeline."""
    skip_steps = skip_steps or []

    logger.info("="*80)
    logger.info("DHWANI ARCHIVE.ORG FETCH PIPELINE")
    logger.info("="*80)
    logger.info(f"Base directory: {BASE_DIR}")
    logger.info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    steps = [
        (1, "Search and Discover", BASE_DIR / "1_search_discover.py"),
        (2, "Download Works", BASE_DIR / "2_download_works.py"),
        (3, "Convert to Markdown", BASE_DIR / "3_convert_to_markdown.py")
    ]

    results = []

    for step_num, step_name, script_path in steps:
        if step_num in skip_steps:
            logger.info(f"\nSkipping Step {step_num}: {step_name}")
            continue

        if not script_path.exists():
            logger.error(f"Script not found: {script_path}")
            results.append(False)
            continue

        success = run_step(step_num, step_name, script_path)
        results.append(success)

        if not success:
            logger.error(f"\nPipeline stopped due to failure in Step {step_num}")
            break

    # Final summary
    logger.info("\n" + "="*80)
    logger.info("PIPELINE COMPLETE")
    logger.info("="*80)

    for i, (step_num, step_name, _) in enumerate(steps):
        if step_num in skip_steps:
            status = "SKIPPED"
        elif i < len(results):
            status = "✓ SUCCESS" if results[i] else "✗ FAILED"
        else:
            status = "NOT RUN"

        logger.info(f"Step {step_num} ({step_name}): {status}")

    # Load and display statistics
    if STATS_FILE.exists():
        try:
            with open(STATS_FILE, 'r') as f:
                stats = json.load(f)

            logger.info("\n" + "="*80)
            logger.info("STATISTICS")
            logger.info("="*80)
            logger.info(f"Total recommended works: {stats.get('total_recommended', 0)}")
            logger.info(f"Searches attempted: {stats.get('searches_attempted', 0)}")
            logger.info(f"Works found: {stats.get('works_found', 0)}")
            logger.info(f"Downloads attempted: {stats.get('downloads_attempted', 0)}")
            logger.info(f"Downloads succeeded: {stats.get('downloads_succeeded', 0)}")
            logger.info(f"Downloads failed: {stats.get('downloads_failed', 0)}")
            logger.info(f"Conversions succeeded: {stats.get('conversions_succeeded', 0)}")
            logger.info(f"Conversions failed: {stats.get('conversions_failed', 0)}")

            # Calculate rates
            searches = stats.get('searches_attempted', 0)
            if searches > 0:
                find_rate = stats.get('works_found', 0) / searches * 100
                logger.info(f"\nFind rate: {find_rate:.1f}%")

            downloads_attempted = stats.get('downloads_attempted', 0)
            if downloads_attempted > 0:
                download_rate = stats.get('downloads_succeeded', 0) / downloads_attempted * 100
                logger.info(f"Download success rate: {download_rate:.1f}%")

            conversions_attempted = stats.get('conversions_succeeded', 0) + stats.get('conversions_failed', 0)
            if conversions_attempted > 0:
                convert_rate = stats.get('conversions_succeeded', 0) / conversions_attempted * 100
                logger.info(f"Conversion success rate: {convert_rate:.1f}%")

        except Exception as e:
            logger.error(f"Could not load statistics: {e}")

    logger.info(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("="*80)

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Run Archive.org fetch pipeline for Dhwani'
    )

    parser.add_argument(
        '--step',
        type=int,
        choices=[1, 2, 3],
        help='Run only a specific step (1=search, 2=download, 3=convert)'
    )

    parser.add_argument(
        '--skip',
        type=int,
        nargs='+',
        choices=[1, 2, 3],
        help='Skip specific steps'
    )

    args = parser.parse_args()

    # Ensure directories exist
    for directory in [DOWNLOADS_DIR, METADATA_DIR, PROCESSED_DIR, LOGS_DIR]:
        ensure_directory(directory)

    if args.step:
        # Run single step
        steps = {
            1: ("Search and Discover", BASE_DIR / "1_search_discover.py"),
            2: ("Download Works", BASE_DIR / "2_download_works.py"),
            3: ("Convert to Markdown", BASE_DIR / "3_convert_to_markdown.py")
        }

        step_name, script_path = steps[args.step]

        if not script_path.exists():
            logger.error(f"Script not found: {script_path}")
            sys.exit(1)

        success = run_step(args.step, step_name, script_path)
        sys.exit(0 if success else 1)

    else:
        # Run full pipeline
        skip_steps = args.skip or []
        run_full_pipeline(skip_steps=skip_steps)

if __name__ == '__main__':
    main()
