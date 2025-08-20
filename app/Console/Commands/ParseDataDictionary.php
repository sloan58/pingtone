<?php

namespace App\Console\Commands;

use App\Services\DataDictionaryParser;
use Exception;
use Illuminate\Console\Command;

class ParseDataDictionary extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data-dictionary:parse';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Parse UCM data dictionary HTML files and store in database';

    /**
     * Execute the console command.
     */
    public function handle(DataDictionaryParser $parser)
    {
        $this->info('UCM Data Dictionary Parser');
        $this->info('==========================');

        $availableVersions = $parser->getAvailableVersions();

        if (empty($availableVersions)) {
            $this->warn('No data dictionary files found in storage.');
            $this->info('Please place HTML files in storage/app/data-dictionary/ directory.');
            return Command::FAILURE;
        }

        $this->info('Available versions: ' . implode(', ', $availableVersions));

        foreach ($availableVersions as $version) {
            $this->parseVersion($parser, $version);
        }

        $this->info('✅ Data dictionary parsing completed successfully!');
        return Command::SUCCESS;
    }

    /**
     * Parse all available versions.
     * @throws Exception
     */
    private function parseAllVersions(DataDictionaryParser $parser): void
    {
        $availableVersions = $parser->getAvailableVersions();

        if (empty($availableVersions)) {
            $this->warn('No data dictionary files found in storage.');
            $this->info('Please place HTML files in storage/app/ucm-data-dictionary/ directory.');
            return;
        }

        $this->info('Available versions: ' . implode(', ', $availableVersions));

        foreach ($availableVersions as $version) {
            $this->parseVersion($parser, $version);
        }
    }

    /**
     * Parse a specific version.
     * @throws Exception
     */
    private function parseVersion(DataDictionaryParser $parser, string $version): void
    {
        $this->info("📖 Parsing UCM {$version} data dictionary...");

        $progressBar = $this->output->createProgressBar(3);
        $progressBar->setFormat('verbose');

        // Step 1: Parse HTML
        $progressBar->setMessage('Parsing HTML file...');
        $progressBar->advance();

        $data = $parser->parseVersion($version);

        // Step 2: Validate data
        $progressBar->setMessage('Validating parsed data...');
        $progressBar->advance();

        $tablesCount = count($data['tables']);
        $fieldsCount = count($data['fields']);

        if ($tablesCount === 0) {
            throw new Exception("No tables found in data dictionary for version {$version}");
        }

        // Step 3: Store in database
        $progressBar->setMessage('Storing in database...');
        $progressBar->advance();

        $parser->storeData($data, $version);

        $progressBar->finish();
        $this->newLine();

        $this->info("✅ UCM {$version}: {$tablesCount} tables, {$fieldsCount} fields");
    }
}
